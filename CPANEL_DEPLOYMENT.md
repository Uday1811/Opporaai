# cPanel Node.js Deployment Guide for opporavibe.com

## Step-by-Step Deployment Instructions

### Step 1: Build Your Project Locally

On your local machine (Windows), build the production version:

```bash
cd Opporaai
pnpm install
pnpm build
```

This creates the `.next` folder with optimized production files.

### Step 2: Upload Files to cPanel

Using cPanel File Manager:

1. Navigate to `/home/oppoesnp/opporavibe` (or create this folder)
2. Upload these files/folders:
   - `.next/` (entire folder after build)
   - `node_modules/` (or install on server - see Step 3)
   - `public/` (entire folder)
   - `app/` (entire folder)
   - `components/` (entire folder)
   - `hooks/` (entire folder)
   - `lib/` (entire folder)
   - `package.json`
   - `next.config.mjs`
   - `tsconfig.json`
   - `tailwind.config.ts`
   - `postcss.config.mjs`
   - `components.json`
   - `app.js` (startup file)
   - `server.js` (alternative startup file)

### Step 3: Install Dependencies on Server

Option A - Upload node_modules (Faster but larger):
- Zip your `node_modules` folder locally
- Upload and extract on server

Option B - Install on Server (Recommended):
1. In cPanel, go to "Terminal" or use SSH
2. Navigate to your app folder:
   ```bash
   cd /home/oppoesnp/opporavibe
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

### Step 4: Configure Node.js Application in cPanel

1. Go to cPanel → "Setup Node.js App" (or "Node.js Selector")
2. Click "Create Application"
3. Configure:
   - **Node.js version**: 20.20.9+ (or latest available)
   - **Application mode**: Production
   - **Application root**: `opporavibe` (folder name)
   - **Application URL**: `opporavibe.com`
   - **Application startup file**: `app.js`
   - **Passenger log file**: Leave default

4. Click "Create"

### Step 5: Set Environment Variables (if needed)

In the Node.js app settings:
1. Click "Add Variable"
2. Add:
   - Name: `NODE_ENV`
   - Value: `production`
3. Click "Save"

### Step 6: Start the Application

1. In the Node.js app interface, click "Run NPM Install" (if you haven't installed dependencies)
2. Click "Restart" or "Start App"
3. Check the status - it should show "Running"

### Step 7: Point Domain to Application

In cPanel:
1. Go to "Domains" or "Addon Domains"
2. Make sure `opporavibe.com` points to the correct document root
3. The Node.js app should automatically handle requests

### Step 8: Verify Deployment

Visit: https://opporavibe.com

You should see your Next.js application running!

## Troubleshooting

### Application won't start

Check the logs:
1. In Node.js app settings, click "Open" next to "Passenger log file"
2. Look for error messages

Common issues:
- Missing dependencies: Run "Run NPM Install"
- Wrong startup file: Make sure it's `app.js`
- Port conflicts: The app should use the port provided by cPanel

### Build errors

If you see build errors:
1. Make sure you built locally with `pnpm build`
2. Upload the entire `.next` folder
3. Ensure all dependencies are installed

### 502 Bad Gateway

This usually means:
- App crashed - check logs
- Wrong application root path
- Missing environment variables

### Static files not loading

Make sure:
- `public/` folder is uploaded
- `.next/static/` folder exists
- File permissions are correct (644 for files, 755 for folders)

## Updating Your Application

When you make changes:

1. Build locally:
   ```bash
   pnpm build
   ```

2. Upload new files:
   - Replace `.next/` folder
   - Upload any changed files in `app/`, `components/`, etc.

3. In cPanel Node.js app settings, click "Restart"

## Quick Update Script (Local)

Create a file `upload.txt` with paths to upload:
```
.next/
app/
components/
public/
package.json
```

Then use cPanel File Manager or FTP to upload these files.

## Alternative: Using Git (if available)

If your cPanel has Git access:

1. SSH into server
2. Navigate to app folder:
   ```bash
   cd /home/oppoesnp/opporavibe
   ```
3. Clone or pull:
   ```bash
   git clone https://github.com/Uday1811/Opporaai.git .
   # or
   git pull origin main
   ```
4. Install and build:
   ```bash
   npm install
   npm run build
   ```
5. Restart app in cPanel

## File Structure on Server

```
/home/oppoesnp/opporavibe/
├── .next/              (built files)
├── node_modules/       (dependencies)
├── public/             (static assets)
├── app/                (Next.js app directory)
├── components/         (React components)
├── hooks/              (React hooks)
├── lib/                (utilities)
├── app.js              (startup file)
├── package.json
├── next.config.mjs
└── other config files
```

## Performance Tips

1. Always use Production mode
2. Make sure `.next` folder is from a production build
3. Enable caching in cPanel if available
4. Use CDN for static assets if needed
5. Monitor application logs regularly

## Support

If you encounter issues:
1. Check Passenger log file in cPanel
2. Verify Node.js version compatibility
3. Ensure all files are uploaded correctly
4. Contact Namecheap support for cPanel-specific issues
