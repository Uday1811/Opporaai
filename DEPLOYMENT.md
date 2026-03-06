# Deployment Guide for Namecheap VPS

## Prerequisites
- Namecheap VPS with Ubuntu/Debian
- Root or sudo access
- Domain pointed to VPS IP address

## Step 1: Initial Server Setup

SSH into your VPS:
```bash
ssh root@your-vps-ip
```

Update system packages:
```bash
apt update && apt upgrade -y
```

## Step 2: Install Node.js and pnpm

Install Node.js (v18 or higher):
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt install -y nodejs
```

Install pnpm:
```bash
npm install -g pnpm
```

Verify installations:
```bash
node --version
pnpm --version
```

## Step 3: Install PM2 Process Manager

```bash
npm install -g pm2
```

## Step 4: Install and Configure Nginx

Install Nginx:
```bash
apt install -y nginx
```

## Step 5: Clone Your Repository

Create directory and clone:
```bash
mkdir -p /var/www
cd /var/www
git clone https://github.com/Uday1811/Opporaai.git opporavibe
cd opporavibe
```

## Step 6: Install Dependencies and Build

```bash
pnpm install
pnpm build
```

## Step 7: Configure PM2

Start the application with PM2:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

Copy and run the command that PM2 outputs to enable startup on boot.

Check status:
```bash
pm2 status
pm2 logs opporavibe
```

## Step 8: Configure Nginx

Copy the nginx configuration:
```bash
cp nginx.conf /etc/nginx/sites-available/opporavibe.com
ln -s /etc/nginx/sites-available/opporavibe.com /etc/nginx/sites-enabled/
```

Remove default site:
```bash
rm /etc/nginx/sites-enabled/default
```

Test nginx configuration:
```bash
nginx -t
```

Restart nginx:
```bash
systemctl restart nginx
```

## Step 9: Configure Firewall

```bash
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

## Step 10: Point Domain to VPS

In Namecheap DNS settings for opporavibe.com:
- Type: A Record, Host: @, Value: YOUR_VPS_IP
- Type: A Record, Host: www, Value: YOUR_VPS_IP

Wait 5-30 minutes for DNS propagation.

## Step 11: Install SSL Certificate (Optional but Recommended)

Install Certbot:
```bash
apt install -y certbot python3-certbot-nginx
```

Get SSL certificate:
```bash
certbot --nginx -d opporavibe.com -d www.opporavibe.com
```

Follow the prompts. Certbot will automatically configure Nginx for HTTPS.

## Step 12: Verify Deployment

Visit your site:
- http://opporavibe.com
- https://opporavibe.com (after SSL setup)

## Updating Your Application

When you push changes to GitHub:

```bash
cd /var/www/opporavibe
git pull origin main
pnpm install
pnpm build
pm2 restart opporavibe
```

## Useful Commands

Check PM2 status:
```bash
pm2 status
pm2 logs opporavibe
pm2 monit
```

Restart application:
```bash
pm2 restart opporavibe
```

Check Nginx status:
```bash
systemctl status nginx
nginx -t
```

View Nginx logs:
```bash
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

## Troubleshooting

### Application not starting
```bash
pm2 logs opporavibe --lines 100
```

### Port 3000 already in use
```bash
lsof -i :3000
kill -9 <PID>
pm2 restart opporavibe
```

### Nginx errors
```bash
nginx -t
systemctl status nginx
tail -f /var/log/nginx/error.log
```

### Check if app is running
```bash
curl http://localhost:3000
```

## Environment Variables (if needed)

Create a `.env.production` file in `/var/www/opporavibe`:
```bash
nano /var/www/opporavibe/.env.production
```

Add your environment variables, then restart:
```bash
pm2 restart opporavibe
```

## Automatic Deployment Script (Optional)

Create a deployment script:
```bash
nano /var/www/deploy.sh
```

Add:
```bash
#!/bin/bash
cd /var/www/opporavibe
git pull origin main
pnpm install
pnpm build
pm2 restart opporavibe
echo "Deployment completed!"
```

Make it executable:
```bash
chmod +x /var/www/deploy.sh
```

Run it:
```bash
/var/www/deploy.sh
```
