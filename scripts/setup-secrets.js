#!/usr/bin/env node
// =============================================================================
// setup-secrets.js — Cross-platform GitHub Secrets seeder
// =============================================================================
// Reads .env.production and pushes every key/value as a GitHub Actions secret.
//
// Special keys (meta — used by CI, not deployed as app env):
//   DEPLOY_SSH_KEY_PATH → reads the file, uploads contents as DEPLOY_SSH_KEY
//   DEPLOY_HOST, DEPLOY_SSH_PORT, DEPLOY_USER, DEPLOY_APP_DIR → deployment config
//
// All other keys are treated as app runtime env vars. The script also creates
// an APP_ENV_KEYS secret (comma-separated list of non-deploy keys) so CI can
// dynamically reconstruct the .env file on the server without hardcoding keys.
//
// Prerequisites: GitHub CLI (gh) installed and authenticated.
// Usage: node scripts/setup-secrets.js   OR   pnpm setup:secrets
// =============================================================================

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

// Keys that are deployment infrastructure, not app runtime env
const DEPLOY_META_KEYS = new Set([
  "DEPLOY_HOST",
  "DEPLOY_SSH_PORT",
  "DEPLOY_USER",
  "DEPLOY_APP_DIR",
  "DEPLOY_SSH_KEY_PATH",
]);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function run(cmd, opts = {}) {
  try {
    return execSync(cmd, {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
      ...opts,
    }).trim();
  } catch (err) {
    if (opts.allowFail) return null;
    console.error(`\n✗ Command failed: ${cmd}`);
    if (err.stderr) console.error(err.stderr.trim());
    process.exit(1);
  }
}

function resolveHome(p) {
  if (p.startsWith("~")) return path.join(os.homedir(), p.slice(1));
  return path.resolve(p);
}

function parseEnvFile(filePath) {
  const lines = fs.readFileSync(filePath, "utf-8").split(/\r?\n/);
  const entries = [];
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eqIdx = line.indexOf("=");
    if (eqIdx === -1) continue;
    const key = line.slice(0, eqIdx).trim();
    let value = line.slice(eqIdx + 1).trim();
    // Strip surrounding quotes if present
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (key) entries.push({ key, value });
  }
  return entries;
}

function setSecret(repo, key, value) {
  // Use stdin for values that may contain special chars
  run(`gh secret set ${key} --repo ${repo}`, { input: value });
}

// ---------------------------------------------------------------------------
// Detect repo from git remote
// ---------------------------------------------------------------------------

function detectRepo() {
  const remote = run("git remote get-url origin", { allowFail: true });
  if (!remote) {
    console.error("✗ Could not detect GitHub repo from git remote.");
    process.exit(1);
  }
  const match = remote.match(/github\.com[:/](.+?)(?:\.git)?$/);
  if (match) return match[1];
  console.error(`✗ Could not parse repo from remote: ${remote}`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const envFile = path.resolve(process.cwd(), ".env.production");
  if (!fs.existsSync(envFile)) {
    console.error("✗ .env.production not found.");
    console.error(
      "  Copy .env.production.example → .env.production and fill in values."
    );
    process.exit(1);
  }

  // Verify gh CLI
  const ghVersion = run("gh --version", { allowFail: true });
  if (!ghVersion) {
    console.error(
      "✗ GitHub CLI (gh) is not installed. https://cli.github.com"
    );
    process.exit(1);
  }

  // Verify auth
  const authStatus = run("gh auth status", { allowFail: true });
  if (!authStatus) {
    console.error("✗ Not authenticated. Run: gh auth login");
    process.exit(1);
  }

  const repo = detectRepo();
  console.log(`\n🔧  Setting up GitHub secrets for ${repo}\n`);

  const entries = parseEnvFile(envFile);
  if (entries.length === 0) {
    console.error("✗ No entries found in .env.production");
    process.exit(1);
  }

  let sshKeyPath = null;
  const appEnvKeys = []; // keys that go into the deployed .env
  const appEnvLines = []; // KEY=VALUE lines for the deployed .env
  let secretCount = 0;

  // ---- Pass 1: collect SSH key path, separate deploy vs app keys ----
  for (const { key, value } of entries) {
    if (key === "DEPLOY_SSH_KEY_PATH") {
      sshKeyPath = value;
    }
  }

  // ---- Pass 2: upload SSH key first ----
  if (sshKeyPath) {
    const resolved = resolveHome(sshKeyPath);
    if (!fs.existsSync(resolved)) {
      console.error(`✗ SSH key not found at: ${resolved}`);
      console.error(
        `  Generate: ssh-keygen -t ed25519 -f "${sshKeyPath}" -N "" -C "ci-deploy"`
      );
      console.error(
        `  Then add the .pub to your server's ~/.ssh/authorized_keys`
      );
      process.exit(1);
    }
    const keyContent = fs.readFileSync(resolved, "utf-8");
    setSecret(repo, "DEPLOY_SSH_KEY", keyContent);
    console.log("  ✓ DEPLOY_SSH_KEY  (from file)");
    secretCount++;
  }

  // ---- Pass 3: set deploy config secrets individually (CI needs them) ----
  //       collect app env vars for the bundled APP_ENV_FILE
  for (const { key, value } of entries) {
    if (key === "DEPLOY_SSH_KEY_PATH") continue; // already handled

    if (DEPLOY_META_KEYS.has(key)) {
      // Deploy infra keys — CI references these directly as ${{ secrets.KEY }}
      setSecret(repo, key, value);
      console.log(`  ✓ ${key}`);
      secretCount++;
    } else {
      // App runtime keys — bundled into APP_ENV_FILE for the server .env
      appEnvKeys.push(key);
      appEnvLines.push(`${key}=${value}`);
    }
  }

  // ---- Pass 4: create APP_ENV_FILE (base64 of the .env for server) ----
  if (appEnvLines.length > 0) {
    const envContent = appEnvLines.join("\n") + "\n";
    const encoded = Buffer.from(envContent).toString("base64");
    setSecret(repo, "APP_ENV_FILE", encoded);
    console.log(
      `  ✓ APP_ENV_FILE  (${appEnvKeys.length} app vars: ${appEnvKeys.join(", ")})`
    );
    secretCount++;
  }

  console.log(`\n✅  ${secretCount} secrets configured!`);
  console.log("   Push to main to deploy.\n");
}

main();
