#!/bin/bash
# Quick setup script for Sync Watch

echo "🎬 Setting up Sync Watch Extension..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install it from https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js found: $(node --version)"
echo ""

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install

if [ $? -eq 0 ]; then
    echo "✅ Backend setup complete!"
else
    echo "❌ Backend setup failed"
    exit 1
fi

cd ..
echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Start the backend server:"
echo "   cd backend && npm start"
echo ""
echo "2. In another terminal, load the extension:"
echo "   - Open chrome://extensions/"
echo "   - Enable Developer mode (top right)"
echo "   - Click 'Load unpacked'"
echo "   - Select the 'extension' folder"
echo ""
echo "3. Open two different Chrome windows and test it out!"
echo ""
