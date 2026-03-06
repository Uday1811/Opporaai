#!/bin/bash

# Deployment script for opporavibe.com
# Run this on your VPS after initial setup

echo "🚀 Starting deployment..."

# Navigate to project directory
cd /var/www/opporavibe || exit

# Pull latest changes
echo "📥 Pulling latest changes from GitHub..."
git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Build the application
echo "🔨 Building application..."
pnpm build

# Restart PM2
echo "♻️  Restarting application..."
pm2 restart opporavibe

# Show status
echo "✅ Deployment completed!"
pm2 status
