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
- **Google Drive Proxy** - Apps Script URL for image uploads
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

### Google Drive Integration Setup
The application supports image uploads to Google Drive using a Google Apps Script proxy. This provides seamless image uploads without requiring user authentication.

#### Step 1: Create Google Apps Script
1. Go to [Google Apps Script](https://script.google.com/)
2. Click **New Project**
3. Replace the default code with the script below
4. Save the project as "TroopManager-Drive-Proxy"

#### Step 2: Apps Script Code
```javascript
function doPost(e) {
  try {
    const requestData = JSON.parse(e.postData.contents);
    const { fileName, fileData, folderName = 'TroopManager-Images' } = requestData;
    
    if (!fileName || !fileData) {
      return createCORSResponse({ error: 'Missing fileName or fileData' });
    }
    
    const folder = getOrCreateFolder(folderName);
    const base64Data = fileData.split(',')[1];
    const mimeType = fileData.split(';')[0].split(':')[1];
    const blob = Utilities.newBlob(Utilities.base64Decode(base64Data), mimeType, fileName);
    
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    const proxyUrl = `${ScriptApp.getService().getUrl()}?fileId=${file.getId()}`;
    
    return createCORSResponse({ 
      success: true, 
      url: proxyUrl,
      fileId: file.getId(),
      fileName: fileName,
      directUrl: `https://drive.google.com/uc?id=${file.getId()}&export=download`
    });
      
  } catch (error) {
    console.error('Error in doPost:', error);
    return createCORSResponse({ 
      error: error.toString(),
      success: false 
    });
  }
}

function doGet(e) {
  try {
    const fileId = e.parameter.fileId;
    const action = e.parameter.action;
    const format = e.parameter.format;
    
    if (!fileId) {
      return createCORSResponse({ 
        error: 'fileId parameter is required',
        success: false 
      });
    }
    
    if (action === 'delete') {
      const file = DriveApp.getFileById(fileId);
      file.setTrashed(true);
      
      return createCORSResponse({ 
        success: true, 
        message: 'File deleted successfully' 
      });
    }
    
    try {
      const file = DriveApp.getFileById(fileId);
      
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      
      if (format === 'json') {
        const blob = file.getBlob();
        const base64Data = Utilities.base64Encode(blob.getBytes());
        const mimeType = blob.getContentType();
        
        return createCORSResponse({
          success: true,
          fileId: fileId,
          fileName: file.getName(),
          mimeType: mimeType,
          base64Data: base64Data,
          dataUrl: `data:${mimeType};base64,${base64Data}`
        });
      }
      
      const directUrl = `https://drive.google.com/uc?id=${fileId}&export=download`;
      
      return HtmlService.createHtmlOutput(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta http-equiv="refresh" content="0;url=${directUrl}">
        </head>
        <body>
          <script>window.location.replace('${directUrl}');</script>
          <p>If you are not redirected, <a href="${directUrl}">click here</a>.</p>
        </body>
        </html>
      `).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
        
    } catch (fileError) {
      return createCORSResponse({ 
        error: `File not found or inaccessible: ${fileError.toString()}`,
        success: false 
      });
    }
      
  } catch (error) {
    console.error('Error in doGet:', error);
    return createCORSResponse({ 
      error: error.toString(),
      success: false 
    });
  }
}

function getOrCreateFolder(folderName) {
  const folders = DriveApp.getFoldersByName(folderName);
  
  if (folders.hasNext()) {
    return folders.next();
  }
  
  return DriveApp.createFolder(folderName);
}

function createCORSResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
```

#### Step 3: Deploy as Web App
1. Click **Deploy** > **New deployment**
2. Choose type: **Web app**
3. Fill in details:
   - **Description**: "TroopManager Drive Upload Proxy"
   - **Execute as**: "Me"
   - **Who has access**: "Anyone"
4. Click **Deploy**
5. Copy the **Web app URL**
6. **Important**: Authorize the script when prompted

#### Step 4: Update Environment Variables
Add to your `.env` file:
```env
REACT_APP_GOOGLE_DRIVE_PROXY_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

#### Benefits of Google Drive Integration
- ✅ **No User Authentication**: Seamless uploads without OAuth popups
- ✅ **Centralized Storage**: All images in your Google Drive account
- ✅ **CORS Solution**: Bypasses browser cross-origin restrictions
- ✅ **Editor Compatible**: Works with rich text editors
- ✅ **Free Solution**: Uses Google's free infrastructure
- ✅ **Auto-scaling**: Google handles all infrastructure needs

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
REACT_APP_GOOGLE_DRIVE_PROXY_URL = https://script.google.com/... (Google Drive proxy)
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
