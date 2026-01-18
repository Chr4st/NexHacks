#!/bin/bash
set -e

echo "🚀 Setting up FlowGuard CI Runner on DigitalOcean Droplet"

# Update system
echo "📦 Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Install Node.js 20
echo "📦 Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pnpm
echo "📦 Installing pnpm..."
curl -fsSL https://get.pnpm.io/install.sh | sh -
export PNPM_HOME="$HOME/.local/share/pnpm"
export PATH="$PNPM_HOME:$PATH"

# Install Playwright dependencies
echo "📦 Installing Playwright dependencies..."
sudo npx playwright install-deps

# Install Playwright browsers
echo "📦 Installing Playwright browsers..."
npx playwright install

# Clone FlowGuard repository (if not already cloned)
if [ ! -d "/home/flowguard" ]; then
  echo "📦 Cloning FlowGuard..."
  git clone https://github.com/Chr4st/NexHacks.git /home/flowguard
fi

cd /home/flowguard

# Install dependencies
echo "📦 Installing FlowGuard dependencies..."
pnpm install

# Build project
echo "🔨 Building FlowGuard..."
pnpm build

# Setup environment variables
echo "🔧 Setting up environment..."
if [ ! -f ".env" ]; then
  cat > .env << EOF
ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
MONGODB_URI=${MONGODB_URI}
PHOENIX_ENDPOINT=${PHOENIX_ENDPOINT}
DO_SPACES_KEY=${DO_SPACES_KEY}
DO_SPACES_SECRET=${DO_SPACES_SECRET}
DO_SPACES_BUCKET=${DO_SPACES_BUCKET}
DO_SPACES_REGION=${DO_SPACES_REGION}
EOF
fi

# Setup systemd service
echo "🔧 Setting up systemd service..."
sudo cat > /etc/systemd/system/flowguard.service << EOF
[Unit]
Description=FlowGuard CI Runner
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/home/flowguard
ExecStart=/usr/bin/node /home/flowguard/dist/cli.js run --all
Restart=always
RestartSec=10
EnvironmentFile=/home/flowguard/.env

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable flowguard.service

echo "✅ FlowGuard CI Runner setup complete!"
echo ""
echo "To start the service:"
echo "  sudo systemctl start flowguard"
echo ""
echo "To view logs:"
echo "  sudo journalctl -u flowguard -f"

