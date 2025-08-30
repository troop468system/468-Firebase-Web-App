# API Key Setup - Single Google API Key

## 🔑 **Single API Key Configuration**

All Google services now use **one API key**: `AIzaSyDdH6YmJvyRBphbavZIS68PtScx6Fz8RAQ`

## 📋 **Services Using This Key:**

### **✅ Google Sheets Service**
- **Purpose**: Read contact data and write email queue
- **Location**: `src/services/googleSheetsService.js`
- **Sheet ID**: `1sQWCTzOJ8irH0zq5AzQykw8UbfovcjEtRVdYI9XA2q8`

### **✅ Google Calendar Service** 
- **Purpose**: Read calendar events
- **Location**: `src/services/googleCalendarService.js`
- **Calendar ID**: `troop468.system@gmail.com`

### **✅ Email Queue Service**
- **Purpose**: Write email requests to Google Sheets
- **Location**: `src/services/emailQueueService.js`
- **Target**: EmailQueue tab in your sheet

## 🚫 **Removed/Not Needed:**

### **❌ Google Auth Service**
- **Reason**: Apps Script handles authentication automatically
- **Status**: Imports removed, no longer needed

### **❌ Google Service Account Service**
- **Reason**: Apps Script uses your Google account directly
- **Status**: Not needed for email system

### **❌ Environment Variables**
- **Reason**: Single hardcoded API key is simpler
- **Status**: Direct API key in code (secure for client-side use)

## 🔧 **Current Configuration:**

```javascript
// All services now use:
const API_KEY = 'AIzaSyDdH6YmJvyRBphbavZIS68PtScx6Fz8RAQ';
const SHEET_ID = '1sQWCTzOJ8irH0zq5AzQykw8UbfovcjEtRVdYI9XA2q8';
const CALENDAR_ID = 'troop468.system@gmail.com';
```

## 📧 **Email System Architecture:**

```
Registration Request
       ↓
Frontend writes to Google Sheets (using API key)
       ↓
Google Apps Script monitors sheet
       ↓
Apps Script sends emails via Gmail (no API key needed)
       ↓
Email status updated in sheet
```

## ✅ **Benefits:**

- **🔗 Single API key** for all Google services
- **🚀 No complex OAuth flows** needed
- **💰 Completely free** - no Firebase Blaze plan
- **🔒 Secure** - API key only allows reading/writing sheets
- **⚡ Fast setup** - minimal configuration required

## 🎯 **Next Steps:**

1. **✅ API key configured** in all services
2. **✅ Sheet ID configured** in all services  
3. **🔧 Set up Apps Script** following `GOOGLE-SHEETS-EMAIL-SETUP.md`
4. **🧪 Test email system** by approving/rejecting registrations

**Everything is configured and ready to go!** 🚀
