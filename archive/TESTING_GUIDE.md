# Quick Testing Guide for TroopManager

## 🚀 Setup Steps

### 1. Firebase Project Setup (Required)
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use existing one
3. Enable Firestore Database
4. Go to Project Settings → General → Your apps
5. Add a web app and copy the configuration
6. Update `.env` file with Firebase credentials:
   ```
   REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID=your_project_id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   REACT_APP_FIREBASE_APP_ID=your_app_id
   ```

### 2. Gmail SMTP Setup (Optional for testing)
1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password: [Google Account Settings](https://myaccount.google.com/apppasswords)
3. Update `.env` file:
   ```
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_16_character_app_password
   ```

### 3. Current Configuration
Your Google Sheets are already configured:
- ✅ API Key: AIzaSyA64XVqb3zH3pomVmmiGBYUW-wehA3CGpE
- ✅ Sheet ID: 1sQWCTzOJ8irH0zq5AzQykw8UbfovcjEtRVdYI9XA2q8

## 🧪 Testing Without Full Setup

### Option 1: Frontend Only (Recommended for initial testing)
```bash
# Start just the frontend
npm start
```
- Dashboard will load at http://localhost:3000
- You can explore the UI
- Settings page will show configuration status
- Contact sync will show "not configured" until Firebase is set up

### Option 2: With Firebase (Full functionality)
```bash
# Terminal 1 - Frontend
npm start

# Terminal 2 - Backend (requires Firebase setup)
npm run server
```

## 🔍 What You Can Test

### Without Firebase Setup:
- ✅ UI Navigation and Design
- ✅ Dashboard Layout
- ✅ Stakeholder Management UI (won't save data)
- ✅ Contact List UI (will show empty)
- ✅ Notification Center UI
- ✅ Settings Page

### With Firebase Setup:
- ✅ All UI functionality
- ✅ Add/Edit/Delete Stakeholders
- ✅ Google Sheets sync and contact import
- ✅ Notification system
- ✅ Data persistence

### With Full Setup (Firebase + Gmail):
- ✅ Everything above
- ✅ Email notifications to stakeholders
- ✅ Complete workflow testing

## 📝 Quick Test Scenario

1. **Start the app**: `npm start`
2. **Go to Settings**: Configure your Firebase credentials
3. **Test Google Sheets**: Click "Test Connection" in Settings
4. **Add Stakeholders**: Go to Stakeholder Management, add a test stakeholder
5. **Sync Contacts**: Go to Dashboard, click "Sync Now"
6. **View Contacts**: Check Contact List for imported data
7. **Check Notifications**: View Notification Center for sync status

## 🚨 Troubleshooting

### Common Issues:
1. **"Firebase not configured"**: Update `.env` with Firebase credentials
2. **"Google Sheets API error"**: Check if API key has Sheets API enabled
3. **"CORS errors"**: Make sure backend server is running on port 3001

### Debug Steps:
1. Check browser console for errors
2. Verify `.env` file has correct values
3. Ensure Google Sheets is publicly accessible or shared
4. Check server logs for detailed error messages

## 🎯 Minimal Test Setup

For the quickest test:
1. Set up Firebase (5 minutes)
2. Update `.env` with Firebase config
3. Run `npm start`
4. Test Google Sheets sync in Dashboard

This will give you a fully functional contact management system!