# Gmail SMTP Setup for Firebase Functions

## 🔐 Step 1: Enable 2-Factor Authentication

1. **Go to**: https://myaccount.google.com/security
2. **Sign in with**: `troop468.system@gmail.com`
3. **Enable 2-Step Verification** (if not already enabled)

## 🔑 Step 2: Create App-Specific Password

1. **Go to**: https://myaccount.google.com/apppasswords
2. **Select app**: "Mail"
3. **Select device**: "Other (custom name)"
4. **Enter name**: "Troop 468 Firebase Functions"
5. **Click**: "Generate"
6. **Copy the 16-character password** (e.g., `abcd efgh ijkl mnop`)

## ⚙️ Step 3: Set Environment Variables

Run these commands in your terminal:

```bash
# Navigate to project root
cd /Users/jerrchan/Documents/Code/Jerry/468/TroopManager

# Set Gmail credentials for Firebase Functions
firebase functions:config:set email.user="troop468.system@gmail.com"
firebase functions:config:set email.password="your-16-char-app-password"

# Verify the configuration
firebase functions:config:get
```

## 🚀 Step 4: Deploy Firebase Functions

```bash
# Build and deploy the functions
firebase deploy --only functions

# Check deployment status
firebase functions:log
```

## ✅ Step 5: Test Email Sending

1. **Go to**: https://troop468-manage.web.app/users
2. **Login as admin**: `admin@troop468.com`
3. **Approve or reject** a registration request
4. **Check console logs** for email sending confirmation
5. **Check email inboxes** for actual emails

## 🔍 Troubleshooting

### If emails don't send:

1. **Check Firebase Functions logs**:
   ```bash
   firebase functions:log --only sendApprovalEmails,sendRejectionEmails
   ```

2. **Verify environment variables**:
   ```bash
   firebase functions:config:get
   ```

3. **Check Gmail settings**:
   - Ensure 2FA is enabled
   - Verify app password is correct
   - Check "Less secure app access" is disabled (we're using app passwords)

### Common Issues:

- **"Invalid credentials"**: Check app password
- **"Authentication failed"**: Verify 2FA is enabled
- **"Daily limit exceeded"**: Gmail SMTP limit reached (500-2000/day)

## 📧 Email Flow

### When you click "Approve":
1. ✅ Firebase updates document status to "approved"
2. ✅ Firebase Function detects the change
3. ✅ Function sends emails to scout, father, mother (if included)
4. ✅ Each person gets personalized invitation email
5. ✅ Console shows "Successfully sent X approval emails"

### When you click "Reject":
1. ❌ Firebase updates document status to "rejected"
2. ❌ Firebase Function detects the change
3. ❌ Function sends rejection emails to all parties
4. ❌ Emails include contact info: troop468.system@gmail.com
5. ❌ Console shows "Successfully sent X rejection emails"

## 🎯 Next Steps

After setup is complete:
1. Test with a real registration request
2. Monitor Firebase Functions logs
3. Check email deliverability
4. Customize email templates if needed

**Ready to send real emails automatically!** 📧🚀
