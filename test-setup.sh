#!/bin/bash

echo "DNSMasq Manager - Test Script"
echo "============================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    exit 1
fi

echo "✅ Node.js is installed: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed"
    exit 1
fi

echo "✅ npm is installed: $(npm --version)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Build the application
echo "🔨 Building application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo "✅ Application built successfully"

# Check if dnsmasq is available (optional)
if command -v dnsmasq &> /dev/null; then
    echo "✅ dnsmasq is available: $(dnsmasq --version | head -n1)"
else
    echo "⚠️  dnsmasq is not installed (required for full functionality)"
fi

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "To start the application:"
echo "  npm run start:dev    # Development mode"
echo "  npm run start:prod    # Production mode"
echo ""
echo "To start with Docker:"
echo "  docker-compose up -d"
echo ""
echo "Web interface will be available at: http://localhost:3000"
