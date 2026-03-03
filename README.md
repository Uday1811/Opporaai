# Oppora.ai — Landing Page

Next.js landing page for [opporaai.co](http://opporaai.co), deployed to cPanel shared hosting via GitHub Actions.

---

## Table of Contents

- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Deployment Architecture](#deployment-architecture)
- [Initial Setup (First Time)](#initial-setup-first-time)
- [Day-to-Day Workflow](#day-to-day-workflow)
- [Changing Server / Credentials](#changing-server--credentials)
- [Adding Environment Variables](#adding-environment-variables)
- [How CI/CD Works](#how-cicd-works)
- [Troubleshooting](#troubleshooting)

---

## Quick Start

```bash
pnpm install      # Install dependencies
pnpm dev          # Start dev server (http://localhost:3000)
pnpm build        # Production build
pnpm start        # Run production build locally
```

---

## Project Structure

```
├── app/                        # Next.js App Router pages & layouts
│   ├── layout.tsx              # Root layout (fonts, metadata)
│   ├── page.tsx                # Landing page
│   └── globals.css             # Global styles
├── components/                 # React components
│   ├── ui/                     # shadcn/ui primitives
│   ├── hero.tsx                # Hero section
│   ├── header.tsx              # Navigation header
│   └── ...                     # Other landing page sections
├── scripts/
│   └── setup-secrets.js        # Cross-platform GitHub Secrets seeder
├── .github/
│   └── workflows/
│       └── deploy.yml          # CI/CD pipeline
├── app.js                      # cPanel Node.js startup wrapper
├── .env.production.example     # Template for secrets (committed)
├── .env.production             # Actual secrets (git-ignored)
├── .npmrc                      # pnpm config (shamefully-hoist for standalone)
├── next.config.mjs             # Next.js config (standalone output)
└── package.json
```

---

## Deployment Architecture

```
Developer Machine                 GitHub Actions                    cPanel Server
┌──────────────┐                ┌──────────────────┐            ┌─────────────────────┐
│ .env.production │──setup:secrets──▶│ GitHub Secrets  │            │ /home/user/appdir/  │
│ (your secrets)  │              │ (encrypted)      │            │  ├── server.js       │
└──────────────┘                │                  │            │  ├── app.js          │
                                │  push to main    │            │  ├── .env            │
       git push ──────────────────▶│  ↓ build        │            │  ├── .next/          │
                                │  ↓ tar + env     │──scp───────▶│  └── node_modules/   │
                                │  ↓ deploy        │            │                     │
                                └──────────────────┘            │  Passenger (cPanel)  │
                                                                │  → node app.js       │
                                                                │  → require server.js │
                                                                └─────────────────────┘
```

**Key details:**
- Next.js builds with `output: 'standalone'` — minimal self-contained server
- The tarball includes dereferenced symlinks (pnpm compat)
- `.env` is reconstructed on the server from the `APP_ENV_FILE` secret (base64)
- App restarts via `cloudlinux-selector restart`

---

## Initial Setup (First Time)

### Prerequisites

| Tool         | Install                  |
| ------------ | ------------------------ |
| Node.js 20+  | https://nodejs.org       |
| pnpm         | `corepack enable`        |
| GitHub CLI   | https://cli.github.com   |
| SSH key pair | `ssh-keygen` (see below) |

### Step 1: Clone & Install

```bash
git clone git@github.com:techxtrmst/opporai.git
cd opporai
pnpm install
```

### Step 2: Create SSH Deploy Key

```bash
# Generate a key pair (no passphrase)
ssh-keygen -t ed25519 -f ~/.ssh/opporai_deploy -N "" -C "opporai-ci-deploy"

# Add the PUBLIC key to the server
ssh-copy-id -i ~/.ssh/opporai_deploy.pub -p 21098 user@server.ip
# Or manually:
# cat ~/.ssh/opporai_deploy.pub | ssh -p PORT user@host "cat >> ~/.ssh/authorized_keys"
```

> **Windows:** Use `ssh-keygen` from Git Bash, PowerShell, or WSL. The path `~/.ssh/opporai_deploy` resolves to `C:\Users\<you>\.ssh\opporai_deploy`.

### Step 3: Configure Secrets

```bash
# Copy the example and fill in your values
cp .env.production.example .env.production
# Edit .env.production with your server IP, SSH port, username, etc.
```

### Step 4: Seed GitHub Secrets

```bash
# Authenticate GitHub CLI (if not already)
gh auth login

# Ensure the correct account is active
gh auth status
# If needed: gh auth switch --user YOUR_USERNAME

# Push all secrets to GitHub
pnpm setup:secrets
```

### Step 5: Set Up cPanel Node.js App

1. Log into cPanel → **Setup Node.js App**
2. Create a Node.js app:
   - **Node.js version:** 20.x
   - **Application mode:** Production
   - **Application root:** your app directory (e.g., `opporaai`)
   - **Application URL:** your domain
   - **Application startup file:** `app.js`
3. Click **Create** / **Save**

### Step 6: Deploy

```bash
git push origin main
```

That's it. GitHub Actions builds, packages, uploads, and restarts the app automatically.

---

## Day-to-Day Workflow

```bash
# 1. Make changes
# 2. Commit & push
git add -A && git commit -m "feat: my changes" && git push origin main
# 3. CI deploys automatically — check status:
gh run watch
```

---

## Changing Server / Credentials

If you migrate to a new server or change credentials:

```bash
# 1. Generate a new SSH key (if the server changed)
ssh-keygen -t ed25519 -f ~/.ssh/opporai_deploy -N "" -C "opporai-ci-deploy"
ssh-copy-id -i ~/.ssh/opporai_deploy.pub -p NEW_PORT user@new.server.ip

# 2. Update .env.production with new values
#    DEPLOY_HOST, DEPLOY_SSH_PORT, DEPLOY_USER, DEPLOY_APP_DIR, etc.

# 3. Re-seed secrets
pnpm setup:secrets

# 4. Push to deploy
git push origin main
```

---

## Adding Environment Variables

To add a new env var (e.g., `DATABASE_URL`):

```bash
# 1. Add to .env.production
echo 'DATABASE_URL=postgresql://user:pass@host/db' >> .env.production

# 2. Re-seed secrets (this updates APP_ENV_FILE automatically)
pnpm setup:secrets

# 3. Push to deploy (new .env will include DATABASE_URL)
git push origin main
```

The `setup:secrets` script automatically:
- Sets deploy infra keys (`DEPLOY_*`) as individual GitHub secrets
- Bundles all other keys into `APP_ENV_FILE` (base64-encoded)
- CI decodes `APP_ENV_FILE` → `.env` on the server

---

## How CI/CD Works

The pipeline ([.github/workflows/deploy.yml](.github/workflows/deploy.yml)):

| Step                  | What it does                                             |
| --------------------- | -------------------------------------------------------- |
| **Checkout**          | Clones the repo                                          |
| **Setup pnpm + Node** | Installs toolchain                                       |
| **Install deps**      | `pnpm install --frozen-lockfile`                         |
| **Build**             | `pnpm build` → standalone output in `.next/standalone/`  |
| **Package**           | Copies static assets, `app.js`, creates `deploy.tar.gz`  |
| **Generate .env**     | Decodes `APP_ENV_FILE` secret → `deploy.env`             |
| **SSH setup**         | Writes deploy key, scans host keys                       |
| **Upload**            | `scp` tarball + env to server                            |
| **Deploy**            | SSH in, clean old files, extract, inject `.env`, restart |
| **Cleanup**           | Remove SSH key from runner                               |

### Secrets used by CI

| Secret            | Source               | Purpose                   |
| ----------------- | -------------------- | ------------------------- |
| `DEPLOY_SSH_KEY`  | SSH private key file | SCP/SSH authentication    |
| `DEPLOY_HOST`     | `.env.production`    | Server IP address         |
| `DEPLOY_SSH_PORT` | `.env.production`    | SSH port                  |
| `DEPLOY_USER`     | `.env.production`    | SSH username              |
| `DEPLOY_APP_DIR`  | `.env.production`    | App directory on server   |
| `APP_ENV_FILE`    | Auto-generated       | Base64 `.env` for the app |

---

## Troubleshooting

### CI deployment fails at SSH step
- **"Load key: error in libcrypto"** — SSH key wasn't stored correctly. Re-run `pnpm setup:secrets`.
- **"Permission denied"** — Public key not in server `~/.ssh/authorized_keys`. Re-add it.

### App doesn't start after deploy
```bash
# SSH into server and check logs
ssh -p PORT user@host
cat ~/appdir/stderr.log

# Test manual startup
source ~/nodevenv/appdir/20/bin/activate
cd ~/appdir
node app.js
```

### Missing module errors
- Ensure `.npmrc` has `shamefully-hoist=true` (required for Next.js standalone + pnpm)
- The tarball uses `--dereference` to resolve pnpm symlinks

### Force restart the app
```bash
ssh user@host "cloudlinux-selector restart --json --interpreter nodejs --app-root ~/appdir"
```

### Check GitHub Actions run status
```bash
gh run list --repo techxtrmst/opporai --limit 5
gh run view <run-id> --log-failed
```

---

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **UI:** Tailwind CSS, shadcn/ui, Radix UI
- **Hosting:** cPanel shared hosting (CloudLinux + Passenger)
- **CI/CD:** GitHub Actions
- **Package Manager:** pnpm (shamefully-hoist mode)

---

## License

Private — All rights reserved.
