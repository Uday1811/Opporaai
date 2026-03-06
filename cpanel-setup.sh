#!/bin/bash

# cPanel Git Deployment Script for opporavibe.com
# Run this script on your cPanel server via SSH or Terminal

echo "🚀 Starting deployment for opporavibe.com..."

# Configuration
APP_DIR="/home/oppoesnp/opporavibe"
REPO_URL="https://github.com/Uday1811/Opporaai.git"
BRANCH="main"

# Navigate to home directory
cd /home/oppoesnp || exit

# Check if directory exists
if [ -d "$APP_DIR" ]; then
    echo "📁 Directory exists. Pulling latest changes..."
    cd "$APP_DIR" || exit
    git pull origin $BRANCH
else
    echo "📥 Cloning repository..."
    git clone $REPO_URL opporavibe
    cd "$APP_DIR" || exit
fi

# Install Node.js dependencies
echo "📦 Installing dependencies..."
npm install --production

# Build the application
echo "🔨 Building Next.js application..."
npm run build

# Set proper permissions
echo "🔐 Setting permissions..."
chmod -R 755 .
find . -type f -exec chmod 644 {} \;
chmod +x app.js

echo "✅ Deployment completed!"
echo ""
echo "Next steps:"
echo "1. Go to cPanel → Setup Node.js App"
echo "2. Create/Edit application with these settings:"
echo "   - Application root: opporavibe"
echo "   - Application URL: opporavibe.com"
echo "   - Application startup file: app.js"
echo "   - Application mode: Production"
echo "3. Click 'Restart' to start the application"
echo ""
echo "Your app should be live at: https://opporavibe.com"
