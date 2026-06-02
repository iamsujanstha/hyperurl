#!/bin/bash
# ====================================================================
# Generic Application Deployment Script (Ubuntu/EC2)
# ====================================================================
set -e

# --- 1. CONFIGURATION (Override these by setting env vars before running) ---
NODE_VERSION="${NODE_VERSION:-22}"                  # Upgraded default to Node 22 (or 20, 18, etc.)
APP_NAME="${APP_NAME:-my-app}"                      # Your application name
APP_DIR="/var/www/${APP_NAME}"                      # Target deployment directory
REPO_SOURCE_DIR="${REPO_SOURCE_DIR:-/home/ubuntu/client-url}"     # Where your code lives temporarily

# Database Configurations
DB_NAME="${DB_NAME:-app_db}"
DB_USER="${DB_USER:-app_user}"
DB_PASS="${DB_PASS:-secure_password_2026}"

echo "🛤️  Starting generic setup for: ${APP_NAME}..."
echo "🚀 Node.js Target Version: ${NODE_VERSION}"
echo "===================================================================="

# --- 2. UPDATE SYSTEM ---
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# --- 3. DYNAMIC NODE.JS INSTALLATION ---
echo "📦 Installing Node.js ${NODE_VERSION}.x..."
curl -fsSL "https://deb.nodesource.com/setup_${NODE_VERSION}.x" | sudo -E bash -
sudo apt install -y nodejs
echo "✅ Node.js version: $(node -v)"
echo "✅ npm version: $(npm -v)"

# --- 4. DEPENDENCY INSTALLATION ---
echo "📦 Installing System Prerequisites (PostgreSQL, Nginx, PM2)..."
sudo apt install -y postgresql postgresql-contrib nginx
sudo npm install -g pm2

# --- 5. DYNAMIC DATABASE CONFIGURATION ---
echo "🗄️  Configuring PostgreSQL Database..."
sudo -u postgres psql <<EOF
CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASS}';
CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};
\c ${DB_NAME}
GRANT ALL ON SCHEMA public TO ${DB_USER};
EOF
echo "✅ PostgreSQL database '${DB_NAME}' and user '${DB_USER}' configured."

# --- 6. FLEXIBLE DIRECTORY SETUP & DEPLOYMENT ---
echo "📁 Setting up project directory at ${APP_DIR}..."
sudo mkdir -p "${APP_DIR}"
sudo chown -R $USER:$USER "${APP_DIR}"

if [ -d "${REPO_SOURCE_DIR}" ]; then
    echo "📋 Copying project files from ${REPO_SOURCE_DIR}..."
    cp -r ${REPO_SOURCE_DIR}/* "${APP_DIR}/"
else
    echo "⚠️ Source directory ${REPO_SOURCE_DIR} not found! Please clone your code manually to ${APP_DIR}."
fi

# --- 7. MODULAR APP BUILD (Updated for Shared Single-Root Layout) ---
echo "📦 Installing project dependencies..."
cd "${APP_DIR}"
npm install

echo "🔨 Building Frontend Assets & Backend Bundle..."
# Runs your Vite compilation and outputs files to ${APP_DIR}/dist
npm run build

echo "🚀 Starting Node Server with PM2..."
# Launches your TypeScript/Express server.ts background runtime
pm2 start server.ts --name "${APP_NAME}-backend" --interpreter npx -- interpreter-args ts-node || pm2 restart "${APP_NAME}-backend"
pm2 save
pm2 startup systemd -u $USER --hp /home/$USER | tail -1 | sudo bash

# --- 8. NGINX ROUTING ---
# Assumes you have a generic nginx conf file in your deploy folder
if [ -f "${APP_DIR}/deploy/nginx.conf" ]; then
    echo "🌐 Configuring Nginx..."
    sudo cp "${APP_DIR}/deploy/nginx.conf" "/etc/nginx/sites-available/${APP_NAME}"
    sudo ln -sf "/etc/nginx/sites-available/${APP_NAME}" "/etc/nginx/sites-enabled/${APP_NAME}"
    sudo rm -f /etc/nginx/sites-enabled/default
    sudo nginx -t
    sudo systemctl restart nginx
    sudo systemctl enable nginx
fi

echo "===================================================================="
echo "🎉 Setup Complete for ${APP_NAME}!"
echo "===================================================================="