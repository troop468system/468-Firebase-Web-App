# 🛠️ Setup Guide

Complete setup instructions for the Troop Manager application.

## 📋 Prerequisites

### Required Software
- **Node.js** 16 or higher
- **npm** (comes with Node.js)
- **Git** for version control

### Firebase Requirements
- Firebase account
- Firebase CLI: `npm install -g firebase-tools`
- Firebase project with:
  - Authentication enabled
  - Firestore database
  - Hosting enabled

## 🚀 Installation

### 1. Clone Repository
```bash
git clone <repository-url>
cd TroopManager
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Firebase Setup
```bash
# Login to Firebase
firebase login

# Initialize project (if needed)
firebase init

# Select:
# - Hosting
# - Firestore
# - Authentication
```

## ⚙️ Configuration

### Environment Variables
Copy the example file and configure:

```bash
# Copy template file
cp .env.example .env

# Edit .env with your actual values
# See .env.example for all required variables and instructions
```

Required environment variables:
- **Firebase Configuration** - Project settings from Firebase Console
- **Google Calendar API** - API key from Google Cloud Console  
- **Google Apps Script** - Webhook URL for email/calendar integration
- **Optional Security** - Webhook token for additional security

### Firebase Configuration
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create new project or select existing
3. Enable Authentication with Google provider
4. Create Firestore database
5. Copy configuration to `.env` file

### Google Calendar Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Enable Calendar API
3. Create API key
4. Add to `.env` file

## 🔐 GitHub Actions Setup (CI/CD)

### Repository Secrets and Variables

For GitHub Actions to build and deploy your app, you need to configure secrets and variables in your repository.

#### 📍 Where to Add Them
1. Go to your GitHub repository
2. Click **Settings** tab
3. Go to **Secrets and variables** → **Actions**

#### 📝 Repository Variables (Non-sensitive)
Add these as **Variables** (public identifiers):

```
REACT_APP_FIREBASE_PROJECT_ID = troop-468-manager
REACT_APP_FIREBASE_AUTH_DOMAIN = troop-468-manager.firebaseapp.com
REACT_APP_FIREBASE_STORAGE_BUCKET = troop-468-manager.appspot.com
REACT_APP_GOOGLE_CALENDAR_ID = your-calendar-id
REACT_APP_GOOGLE_SHEETS_SHEET_ID = your-sheet-id
```

#### 🔐 Repository Secrets (Sensitive)
Add these as **Secrets** (API keys and access tokens):

```
REACT_APP_FIREBASE_API_KEY = AIzaSyC... (from Firebase Console)
REACT_APP_FIREBASE_APP_ID = 1:123456789:web:abc123... (from Firebase Console)
REACT_APP_FIREBASE_MESSAGING_SENDER_ID = 123456789 (from Firebase Console)
REACT_APP_FIREBASE_MEASUREMENT_ID = G-ABC123DEF (from Firebase Console)
REACT_APP_GOOGLE_API_KEY = AIzaSyD... (from Google Cloud Console)
REACT_APP_EMAIL_WEBHOOK_URL = https://script.google.com/... (Google Apps Script)
FIREBASE_SERVICE_ACCOUNT_TROOP_468_MANAGER = {...} (Firebase service account JSON)
```

#### 🔍 How to Get Firebase Values
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **troop-468-manager**
3. Click **⚙️ Project Settings**
4. Scroll to **"Your apps"** section
5. Click on your web app
6. Copy the config values from the displayed `firebaseConfig` object

#### 🔑 Firebase Service Account Setup
1. In Firebase Console, go to **Project Settings** → **Service accounts**
2. Click **Generate new private key**
3. Download the JSON file
4. Copy the **entire JSON content** as the value for `FIREBASE_SERVICE_ACCOUNT_TROOP_468_MANAGER`

#### ✅ Verification
After adding all secrets and variables:
- Push a commit to trigger GitHub Actions
- Check the **Actions** tab in your repository
- Builds should now complete successfully
- App will deploy to Firebase Hosting automatically

## 🧪 Verification

### Test Installation
```bash
# Run tests
npm run test:all

# Start development server
npm run dev:skip-tests

# Visit http://localhost:3000
```

### Test Firebase Connection
```bash
# Test Firebase connection
firebase projects:list

# Test Firestore rules
firebase firestore:rules:get
```

## 🔧 Troubleshooting

### Common Issues

**Node.js Version**
```bash
# Check version
node --version

# Should be 16 or higher
# Use nvm to manage versions if needed
```

**Firebase CLI Issues**
```bash
# Reinstall Firebase CLI
npm uninstall -g firebase-tools
npm install -g firebase-tools

# Re-login
firebase logout
firebase login
```

**Environment Variables**
- Ensure `.env` file is in project root
- Check variable names match exactly
- Restart development server after changes

**Port Conflicts**
```bash
# If port 3000 is busy, specify different port
PORT=3001 npm start
```

## 📚 Next Steps

After setup is complete:

1. **[Development Guide](DEVELOPMENT.md)** - Development workflow
2. **[Testing Guide](TESTING.md)** - Running and writing tests
3. **[Deployment Guide](DEPLOY.md)** - Production deployment

## 🆘 Getting Help

- Check error messages carefully
- Verify all prerequisites are installed
- Ensure Firebase project is properly configured
- Review environment variables
- Check [Development Guide](DEVELOPMENT.md) for common workflows
