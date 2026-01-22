#!/bin/bash
# Deploy Study Materials Frontend to Production

set -e  # Exit on any error

# Configuration
SERVER="root@135.125.213.38"
REMOTE_PATH="/usr/share/angie/html/study-material-frontend"
BUILD_FILE="frontend-build.tar.gz"

echo "🔨 Building frontend..."
npm run build

echo "📦 Packaging build..."
tar -czf $BUILD_FILE .next public package.json package-lock.json

echo "📤 Uploading to server..."
scp $BUILD_FILE $SERVER:/tmp/

echo "🚀 Deploying on server..."
ssh $SERVER << 'EOF'
  # Remove old backup and create new one
rm -rf /usr/share/angie/html/study-material-frontend.backup
if [ -d /usr/share/angie/html/study-material-frontend ]; then
  mv /usr/share/angie/html/study-material-frontend /usr/share/angie/html/study-material-frontend.backup
fi
  
  # Create fresh directory
  mkdir -p /usr/share/angie/html/study-material-frontend
  cd /usr/share/angie/html/study-material-frontend
  
  # Extract new build
  tar -xzf /tmp/frontend-build.tar.gz
  
  # Fix ownership
  chown -R angie:angie /usr/share/angie/html/study-material-frontend
  chmod -R 755 /usr/share/angie/html/study-material-frontend
  
  # Install production dependencies
  npm ci --production
  
  # Restart Next.js service (we'll create this systemd service next)
  systemctl restart nextjs-frontend
  
  # Cleanup
  rm /tmp/frontend-build.tar.gz
  
  # Reload angie
  angie -t && systemctl reload angie
EOF

echo "🧹 Cleaning up local build file..."
rm $BUILD_FILE

echo "✅ Deployment complete!"
echo "🌐 Visit: https://study.kli.one"