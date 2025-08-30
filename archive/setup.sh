#!/bin/bash

echo "🚀 Setting up TroopManager..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

echo "✅ Node.js found: $(node --version)"

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
npm install

# Install server dependencies
echo "📦 Installing server dependencies..."
cd server
npm install
cd ..

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp env.example .env
    echo "⚠️  Please edit the .env file with your configuration before running the app."
else
    echo "✅ .env file already exists"
fi

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "⚠️  Firebase CLI not found. Install it with: npm install -g firebase-tools"
else
    echo "✅ Firebase CLI found: $(firebase --version)"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit the .env file with your Firebase and Google Sheets configuration"
echo "2. Initialize Firebase: firebase init"
echo "3. Deploy Firestore rules: firebase deploy --only firestore:rules"
echo "4. Start the development server:"
echo "   - Frontend: npm start"
echo "   - Backend: npm run server"
echo ""
echo "📖 See README.md for detailed setup instructions."