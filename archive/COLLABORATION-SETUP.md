# Environment Variables for Team Collaboration 👥

## 🤔 **The Problem:**
- `.env` files contain sensitive data and can't be committed to Git
- New team members need the actual values to run the project
- Values need to stay synchronized across the team

## 🎯 **Solutions for Collaboration:**

### **1. .env.example File (✅ Recommended)**
```bash
# This file IS committed to Git
.env.example    # Template with placeholders
.env           # Actual values - NOT committed (gitignored)
```

**Setup Process:**
1. **New team member clones repo**
2. **Copies .env.example to .env**: `cp .env.example .env`
3. **Gets actual values** from team lead/documentation
4. **Replaces placeholders** with real values

### **2. Secure Documentation (✅ Good)**
**Create a team document** with actual values:
- **Google Docs** (private, team access only)
- **Notion page** (private workspace)  
- **Team wiki** (private repository)
- **Password manager** (shared vault)

### **3. Development vs Production Values**

#### **For Public APIs (Current Setup):**
```bash
# These can be shared more openly since they're client-side
REACT_APP_GOOGLE_API_KEY=AIzaSyDdH6YmJvyRBphbavZIS68PtScx6Fz8RAQ
REACT_APP_GOOGLE_SHEETS_SHEET_ID=1sQWCTzOJ8irH0zq5AzQykw8UbfovcjEtRVdYI9XA2q8
REACT_APP_GOOGLE_CALENDAR_ID=troop468.system@gmail.com
```

**Why these are "safer" to share:**
- ✅ Google API keys are designed for client-side use
- ✅ They're visible in browser anyway (bundled in build)
- ✅ Protected by domain restrictions
- ✅ No sensitive backend data access

### **4. Platform-Specific Solutions:**

#### **For Small Teams (2-5 people):**
**Quick Setup Script:**
```bash
#!/bin/bash
# setup-env.sh (committed to repo)
echo "Setting up environment variables..."
cp .env.example .env
echo "Please edit .env with actual values from team documentation"
echo "Contact [team-lead] for the current values"
```

#### **For Larger Teams:**
**Automated Setup:**
```bash
# Use a configuration management tool
# or environment variable injection
```

### **5. Current Project Setup:**

**✅ What we have:**
1. **`.env.example`** - Template for new developers
2. **Real values documented** in `COLLABORATION-SETUP.md`
3. **Clear instructions** for setup

**🔧 New Developer Setup:**
```bash
# 1. Clone repository
git clone [repo-url]
cd TroopManager

# 2. Copy environment template
cp .env.example .env

# 3. Add actual values to .env
# Use values from this documentation or team lead
```

## 📋 **Current Environment Values:**

### **For Troop 468 Project:**
```bash
# Google API Configuration
REACT_APP_GOOGLE_API_KEY=AIzaSyDdH6YmJvyRBphbavZIS68PtScx6Fz8RAQ

# Google Sheets Configuration
REACT_APP_GOOGLE_SHEETS_SHEET_ID=1sQWCTzOJ8irH0zq5AzQykw8UbfovcjEtRVdYI9XA2q8

# Google Calendar Configuration  
REACT_APP_GOOGLE_CALENDAR_ID=troop468.system@gmail.com
```

**Note:** These values are for the Troop 468 production system. They're relatively safe to share since they're client-side API keys with domain restrictions.

## 🚀 **Deployment Collaboration:**

### **Development Environment:**
- Each developer uses same `.env` values
- Local development against shared Google Sheets/Calendar

### **Production Environment:**
- Firebase Hosting: Variables built into bundle automatically
- Other platforms: Set environment variables in platform settings

### **Different Environments:**
```bash
# .env.development
REACT_APP_GOOGLE_SHEETS_SHEET_ID=test_sheet_id

# .env.production  
REACT_APP_GOOGLE_SHEETS_SHEET_ID=production_sheet_id
```

## 🔒 **Security Best Practices:**

### **✅ Safe to Share Openly:**
- Public API keys (with restrictions)
- Sheet IDs for public/shared sheets
- Calendar IDs for public calendars
- Configuration flags

### **❌ Never Share in Git:**
- Database passwords
- Private API keys
- Secret tokens
- User credentials

### **🔧 For Sensitive Values:**
1. **Use a secrets management service**
2. **Encrypt and share via secure channels**
3. **Use team password managers**
4. **Set up dedicated development/test resources**

## 📝 **Onboarding Checklist:**

**For new team members:**
- [ ] Clone repository
- [ ] Copy `.env.example` to `.env`
- [ ] Get actual values from team documentation
- [ ] Test local development setup
- [ ] Verify API access works
- [ ] Confirm build process works

## 🎯 **Recommended Approach:**

**For Troop 468:**
1. **Keep current .env.example** (template)
2. **Document actual values** in team wiki/docs
3. **New developers copy and paste** values from documentation
4. **Use shared resources** (same Google Sheet/Calendar for dev)

**This balances security with practical collaboration needs!** 🚀👥
