# Google Sheets + Apps Script Email Setup

This setup allows the frontend to write email data to Google Sheets, and Google Apps Script automatically sends the emails. **No Firebase Blaze plan required!**

## 🎯 **How It Works:**

1. **Frontend writes to Google Sheets** when admin approves/rejects
2. **Google Apps Script monitors the sheet** for new email requests
3. **Apps Script automatically sends emails** via Gmail
4. **Email status is tracked** in the sheet (PENDING → SENT/FAILED)

## 📊 **Step 1: Set Up Email Queue Sheet**

### **Option A: Add to Existing Sheet**
1. **Go to**: Your existing Google Sheet
2. **Add new tab**: Right-click tabs → "Insert sheet"
3. **Name it**: "EmailQueue"

### **Option B: Create New Sheet**
1. **Go to**: https://sheets.google.com
2. **Create**: New blank spreadsheet
3. **Name it**: "Troop 468 Email Queue"
4. **Note the Sheet ID** from the URL

## 🔧 **Step 2: Set Up Google Apps Script**

1. **Open Apps Script**: https://script.google.com
2. **New Project**: Click "New project"
3. **Name it**: "Troop 468 Email Automation"
4. **Replace code**: Paste the code from `google-apps-script-email.js`
5. **Save**: Ctrl+S or File → Save

## ⚙️ **Step 3: Configure Apps Script**

1. **Update Sheet ID**: In the frontend code, update this line:
   ```javascript
   this.emailQueueSheetId = 'YOUR_SHEET_ID_HERE';
   ```

2. **Set up Gmail permissions**:
   - Apps Script will ask for Gmail permissions
   - Allow access to send emails on your behalf

## 🔗 **Step 4: Create Triggers**

In Apps Script:

1. **Run setup function**:
   ```javascript
   // Click the "setup" function and run it
   ```

2. **Or create triggers manually**:
   - **Trigger 1**: `onEdit` → On edit → Any spreadsheet
   - **Trigger 2**: `processEmailQueue` → Time-driven → Every 5 minutes

## 🎯 **Step 5: Update Frontend Configuration**

Update the sheet ID in your frontend:

\`\`\`javascript
// In src/services/emailQueueService.js
this.emailQueueSheetId = 'YOUR_ACTUAL_SHEET_ID';
\`\`\`

## 🚀 **Step 6: Deploy and Test**

1. **Build and deploy**:
   ```bash
   npm run build
   firebase deploy --only hosting
   ```

2. **Test the flow**:
   - Go to Users page
   - Approve/reject a registration
   - Check Google Sheets for new rows
   - Check if emails are sent automatically

## 📋 **Email Queue Sheet Structure:**

| Column | Purpose | Example |
|--------|---------|---------|
| Timestamp | When queued | 2025-01-19T10:30:00Z |
| Type | APPROVAL/REJECTION | APPROVAL |
| To Email | Recipient | scout@example.com |
| To Name | Recipient name | John Smith |
| Role | scout/parent | scout |
| Subject | Email subject | Welcome to Troop 468! |
| Body | HTML email body | `<div>...</div>` |
| Status | PENDING/SENT/FAILED | SENT |
| Sent At | When sent | 2025-01-19 10:31:15 |
| Data | Full request data | JSON object |

## 🔍 **Monitoring and Debugging**

### **Check Email Status:**
- **PENDING**: Waiting to be sent
- **SENT**: Successfully sent
- **FAILED**: Error occurred

### **Apps Script Logs:**
1. **Go to**: Apps Script project
2. **Click**: "Executions" in left sidebar
3. **View**: Logs and errors

### **Test Manually:**
Run `testEmailQueue()` function in Apps Script to process emails immediately.

## ✅ **Benefits of This Approach:**

- ✅ **No Firebase Blaze plan** required
- ✅ **Free Gmail sending** (500-2000 emails/day)
- ✅ **Automatic processing** every 5 minutes
- ✅ **Email tracking** in Google Sheets
- ✅ **Easy debugging** - see all email data
- ✅ **Reliable** - Google infrastructure
- ✅ **Scalable** - can handle hundreds of emails

## 🚨 **Important Notes:**

1. **Gmail Daily Limits**: 500-2000 emails per day (plenty for troops)
2. **Sheet Permissions**: Make sure Apps Script can access the sheet
3. **Email Permissions**: Apps Script needs Gmail sending permissions
4. **Trigger Delays**: Emails sent within 5 minutes (or instantly on edit)

## 🎉 **Ready to Go!**

Once set up:
- Approve registration → Email queued → Apps Script sends automatically
- Reject registration → Rejection emails sent to all parties
- All email activity tracked in Google Sheets
- No Firebase billing required!

**Professional email automation using free Google services!** 📧🚀
