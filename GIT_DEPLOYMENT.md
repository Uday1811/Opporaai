# Git Deployment Guide for cPanel

## Method 2: Deploy via Git Repository

This method uses Git to clone your repository directly on the cPanel server.

---

## Prerequisites

1. SSH access to your cPanel account (or cPanel Terminal)
2. Git installed on the server (usually pre-installed)
3. Your GitHub repository: `https://github.com/Uday1811/Opporaai.git`

---

## Step 1: Enable SSH Access in Namecheap

### Option A: Use cPanel Terminal (Easier)
1. Log into cPanel
2. Search for "Terminal" in the search bar
3. Click on "Terminal" to open it
4. Skip to Step 2

### Option B: Use SSH Client (More powerful)
1. Log into cPanel
2. Go to "Security" → "SSH Access"
3. Click "Manage SSH Keys"
4. Generate a new key or use existing
5. Authorize the key
6. Note your SSH details:
   - Host: Usually shown in cPanel (e.g., `server123.web-hosting.com`)
   - Port: 21098 (or check in SSH Access page)
   - Username: `oppoesnp` (your cPanel username)

7. Connect via SSH client (Windows):
   ```bash
   ssh -p 21098 oppoesnp@server123.web-hosting.com
   ```
   Or use PuTTY with the same details.

---

## Step 2: Clone Repository on Server

Once you're in the terminal (cPanel Terminal or SSH):

### Navigate to home directory:
```bash
cd /home/oppoesnp
```

### Check if opporavibe folder exists:
```bash
ls -la
```

### Clone the repository:
```bash
git clone https://github.com/Uday1811/Opporaai.git opporavibe
```

If it asks for credentials:
- Username: Your GitHub username
- Password: Use a GitHub Personal Access Token (not your password)

**To create a GitHub token:**
1. Go to GitHub.com → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token
3. Select scope: `repo` (full control of private repositories)
4. Copy the token and use it as password

### Navigate into the cloned directory:
```bash
cd opporavibe
```

---

## Step 3: Install Dependencies

```bash
npm install --production
```

This will install all required packages from `package.json`.

---

## Step 4: Build the Application

```bash
npm run build
```

This creates the optimized `.next` folder for production.

---

## Step 5: Set Proper Permissions

```bash
chmod -R 755 /home/oppoesnp/opporavibe
find /home/oppoesnp/opporavibe -type f -exec chmod 644 {} \;
```

---

## Step 6: Configure Node.js App in cPanel

1. Go to cPanel → "Setup Node.js App"
2. Click "Create Application" (or edit if exists)
3. Configure:
   - **Node.js version**: 20.20.9+ (latest available)
   - **Application mode**: Production
   - **Application root**: `opporavibe`
   - **Application URL**: `opporavibe.com`
   - **Application startup file**: `app.js`
   - **Environment variables**:
     - Name: `NODE_ENV`, Value: `production`

4. Click "Create" or "Save"

---

## Step 7: Start the Application

In the Node.js app interface:
1. Click "Restart" (or "Start App" if new)
2. Wait for status to show "Running"
3. Check logs if there are any errors

---

## Step 8: Verify Deployment

Visit: **https://opporavibe.com**

Your Next.js app should be live!

---

## Automated Deployment Script

I've created a script to automate steps 2-4. Here's how to use it:

### Download and run the script:

```bash
cd /home/oppoesnp
curl -O https://raw.githubusercontent.com/Uday1811/Opporaai/main/cpanel-setup.sh
chmod +x cpanel-setup.sh
./cpanel-setup.sh
```

Or manually copy the script content from `cpanel-setup.sh` in your repo.

---

## Updating Your Application (Future Updates)

When you push changes to GitHub:

### SSH into your server:
```bash
ssh -p 21098 oppoesnp@server123.web-hosting.com
```

### Navigate to app directory:
```bash
cd /home/oppoesnp/opporavibe
```

### Pull latest changes:
```bash
git pull origin main
```

### Install any new dependencies:
```bash
npm install --production
```

### Rebuild:
```bash
npm run build
```

### Restart app in cPanel:
Go to cPanel → Setup Node.js App → Click "Restart"

---

## Quick Update Script

Create this script on your server for easy updates:

```bash
nano /home/oppoesnp/update-opporavibe.sh
```

Add this content:
```bash
#!/bin/bash
cd /home/oppoesnp/opporavibe
git pull origin main
npm install --production
npm run build
echo "✅ Update complete! Now restart the app in cPanel."
```

Make it executable:
```bash
chmod +x /home/oppoesnp/update-opporavibe.sh
```

Run it anytime:
```bash
/home/oppoesnp/update-opporavibe.sh
```

Then restart the app in cPanel.

---

## Troubleshooting

### Git clone fails with authentication error

**Solution**: Use GitHub Personal Access Token
1. Generate token at: https://github.com/settings/tokens
2. Use token as password when cloning

Or use SSH key:
```bash
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
cat ~/.ssh/id_rsa.pub
```
Copy the output and add to GitHub → Settings → SSH Keys

Then clone with SSH:
```bash
git clone git@github.com:Uday1811/Opporaai.git opporavibe
```

### npm install fails

**Check Node.js version:**
```bash
node --version
npm --version
```

Should be Node.js 18+ and npm 9+.

**Try clearing cache:**
```bash
npm cache clean --force
npm install --production
```

### Build fails

**Check for errors:**
```bash
npm run build 2>&1 | tee build.log
cat build.log
```

**Common issues:**
- Missing dependencies: Run `npm install` again
- Memory issues: Contact Namecheap to increase memory limit
- TypeScript errors: Check your code for type errors

### App won't start in cPanel

**Check these:**
1. Application root path is correct: `opporavibe`
2. Startup file exists: `app.js`
3. `.next` folder exists (from build)
4. Environment variable `NODE_ENV=production` is set
5. Check Passenger log file for errors

### Permission denied errors

```bash
chmod -R 755 /home/oppoesnp/opporavibe
chown -R oppoesnp:oppoesnp /home/oppoesnp/opporavibe
```

---

## File Structure on Server

After deployment, your structure should look like:

```
/home/oppoesnp/opporavibe/
├── .git/                   (Git repository data)
├── .next/                  (Built Next.js files)
├── node_modules/           (Dependencies)
├── public/                 (Static assets)
├── app/                    (Next.js app directory)
├── components/             (React components)
├── hooks/                  (React hooks)
├── lib/                    (Utilities)
├── app.js                  (Startup file for cPanel)
├── package.json
├── next.config.mjs
└── other config files
```

---

## Security Tips

1. **Never commit sensitive data** to Git (API keys, passwords)
2. Use environment variables in cPanel for secrets
3. Keep your GitHub token secure
4. Regularly update dependencies: `npm update`
5. Monitor application logs for suspicious activity

---

## Support

If you encounter issues:
1. Check the Passenger log file in cPanel Node.js app settings
2. Review build logs: `npm run build`
3. Test locally first: `npm run dev`
4. Contact Namecheap support for server-specific issues

---

## Summary

✅ Clone repo with Git
✅ Install dependencies with npm
✅ Build with `npm run build`
✅ Configure in cPanel Node.js App
✅ Start and verify

Your app is now deployed and connected to your Git repository!
