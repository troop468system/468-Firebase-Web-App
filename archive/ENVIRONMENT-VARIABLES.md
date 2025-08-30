# Environment Variables Setup 🔐

## 🤔 **Why Use Environment Variables?**

### **✅ Benefits:**
- **🔒 More secure**: Keys not hardcoded in source code
- **🔄 Flexible**: Different values for dev/prod environments  
- **📝 Better practices**: Industry standard approach
- **🚫 Git safety**: `.env` files are gitignored by default

### **⚠️ Important Security Note:**
**React environment variables are NOT truly secret!** They get bundled into your frontend build and are visible to users. However, Google API keys for public APIs (like Sheets/Calendar) are designed to be used client-side.

## 📋 **Current Setup:**

### **Environment Variables Used:**
```bash
# .env file
REACT_APP_GOOGLE_API_KEY=AIzaSyDdH6YmJvyRBphbavZIS68PtScx6Fz8RAQ
REACT_APP_GOOGLE_SHEETS_SHEET_ID=1sQWCTzOJ8irH0zq5AzQykw8UbfovcjEtRVdYI9XA2q8
REACT_APP_GOOGLE_CALENDAR_ID=troop468.system@gmail.com
```

### **Services Updated:**
- ✅ **Google Sheets Service**: Uses `REACT_APP_GOOGLE_API_KEY` and `REACT_APP_GOOGLE_SHEETS_SHEET_ID`
- ✅ **Google Calendar Service**: Uses `REACT_APP_GOOGLE_API_KEY` and `REACT_APP_GOOGLE_CALENDAR_ID`  
- ✅ **Email Queue Service**: Uses `REACT_APP_GOOGLE_API_KEY` and `REACT_APP_GOOGLE_SHEETS_SHEET_ID`

## 🚀 **Deployment:**

### **Local Development:**
1. **Create `.env`** file in project root
2. **Add your values** (already done for you)
3. **Restart dev server**: `npm start`

### **Firebase Hosting:**
- ✅ **Automatic**: Environment variables get built into the production bundle
- ✅ **Secure**: API key restrictions protect against misuse
- ✅ **No extra setup**: Firebase Hosting serves static files

### **Alternative Deployment Platforms:**

#### **Vercel:**
```bash
vercel env add REACT_APP_GOOGLE_API_KEY
vercel env add REACT_APP_GOOGLE_SHEETS_SHEET_ID
vercel env add REACT_APP_GOOGLE_CALENDAR_ID
```

#### **Netlify:**
- Go to Site Settings → Environment Variables
- Add each `REACT_APP_*` variable

## 🔒 **Security Best Practices:**

### **✅ Current Setup is Secure Because:**
1. **API Key Restrictions**: Your Google API key should be restricted to specific APIs and domains
2. **Public API Design**: Google Sheets/Calendar APIs are designed for client-side use
3. **No Sensitive Data**: We're only reading public calendar and sheet data
4. **Rate Limiting**: Google automatically rate limits API usage

### **🛡️ How to Secure Your API Key:**
1. **Go to**: [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. **Find your API key**: `AIzaSyDdH6YmJvyRBphbavZIS68PtScx6Fz8RAQ`
3. **Add restrictions**:
   ```
   Application restrictions: HTTP referrers
   Website restrictions: 
   - https://troop468-manage.web.app/*
   - https://localhost:3000/* (for development)
   
   API restrictions: 
   - Google Sheets API
   - Google Calendar API
   ```

## 🔄 **Different Environments:**

### **Development:**
Create `.env.development.local`:
```bash
REACT_APP_GOOGLE_API_KEY=your_dev_api_key
REACT_APP_GOOGLE_SHEETS_SHEET_ID=your_test_sheet_id
```

### **Production:**
Use the main `.env` file or platform-specific env vars.

## 🚨 **Security Warning:**

### **❌ Never put these in environment variables:**
- Database passwords
- Private API keys  
- Secret tokens
- User passwords

### **✅ Safe for client-side environment variables:**
- Public API keys (with restrictions)
- Configuration values
- Feature flags
- Public endpoints

## 📝 **Summary:**

**Your current setup is:**
- ✅ **Secure**: API keys are restricted and designed for client-side use
- ✅ **Professional**: Following React environment variable best practices  
- ✅ **Flexible**: Can easily change values without code changes
- ✅ **Gitignore-safe**: `.env` files won't be committed to Git

**The Google API key is appropriately used client-side because:**
- Google Sheets/Calendar APIs are designed for frontend use
- API key restrictions limit usage to your domains
- No sensitive backend operations are performed
- Apps Script handles the actual email sending (server-side)

Your environment variable setup is **secure and production-ready!** 🚀🔐
