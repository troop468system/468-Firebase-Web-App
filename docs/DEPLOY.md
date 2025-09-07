# 🚀 Deployment Guide

Complete deployment instructions for the Troop Manager application.

## 🎯 Quick Deployment

```bash
# Production deployment (recommended)
npm run deploy

# Quick deployment (skip tests)
npm run deploy:skip-tests

# Development server
npm run dev
npm run dev:skip-tests
```

## 📋 Prerequisites

### Required Tools
- **Node.js** 16 or higher
- **Firebase CLI**: `npm install -g firebase-tools`
- **Git** for version control

### Firebase Setup
- Firebase project with Hosting enabled
- Authentication configured
- Firestore database created
- Proper IAM permissions

## 🛠️ Deployment Script

The `deploy.sh` script handles both development and production deployment with built-in quality gates.

### Script Features
- **Quality Gates**: Automated linting and testing
- **Environment Detection**: Automatic dev/prod mode
- **Error Handling**: Helpful error messages and guidance
- **Flexible Options**: Skip tests when needed
- **Status Reporting**: Clear progress and results

### Usage
```bash
# Development mode
./deploy.sh dev                    # With full validation
./deploy.sh dev --skip-tests       # Quick start

# Production mode  
./deploy.sh prod                   # With full validation
./deploy.sh prod --skip-tests      # Quick deployment

# Help
./deploy.sh --help
```

## 🔄 Development Deployment

### Local Development Server
```bash
# Recommended: Quick start
npm run dev:skip-tests

# Full validation (slower)
npm run dev

# Manual script
./deploy.sh dev
```

**What happens:**
1. **Dependency Check** - Verifies Node.js and npm
2. **Install Dependencies** - Runs `npm install` if needed
3. **Linting** - ESLint code quality checks
4. **Testing** - Full test suite (unless skipped)
5. **Start Server** - Launches development server on port 3000

### Development Features
- **Hot Reload** - Automatic browser refresh on changes
- **Error Overlay** - In-browser error display
- **Source Maps** - Debug original source code
- **Fast Refresh** - Preserve component state during edits

## 🌐 Production Deployment

### Firebase Hosting
```bash
# Full deployment with validation
npm run deploy

# Quick deployment
npm run deploy:skip-tests

# Manual script
./deploy.sh prod
```

**What happens:**
1. **Quality Gates** - Linting and testing
2. **Build Process** - Creates optimized production build
3. **Firebase Deploy** - Uploads to Firebase Hosting
4. **URL Display** - Shows live application URL

### Build Optimization
- **Code Splitting** - Lazy loading for better performance
- **Minification** - Compressed JavaScript and CSS
- **Asset Optimization** - Optimized images and fonts
- **Service Worker** - Caching for offline functionality

## ⚙️ Configuration

### Environment Variables
Production deployment requires proper environment configuration:

```env
# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=your_production_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_production_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=your_production_app_id

# API Configuration
REACT_APP_GOOGLE_CALENDAR_API_KEY=your_calendar_api_key
REACT_APP_WEBHOOK_URL=your_production_webhook_url
```

### Firebase Configuration
```json
{
  "hosting": {
    "public": "build",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "/static/**",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=31536000"
          }
        ]
      }
    ]
  }
}
```

## 🔍 Quality Gates

### Automated Checks
The deployment script includes several quality gates:

1. **Linting** - ESLint code quality
2. **Testing** - Full test suite (64 tests)
3. **Build Validation** - Successful production build
4. **Dependency Check** - All required tools available

### Bypassing Quality Gates
```bash
# Skip all tests (use sparingly)
npm run deploy:skip-tests
./deploy.sh prod --skip-tests

# The script will show warnings when skipping tests
```

## 📊 Deployment Monitoring

### Build Metrics
- **Build Time** - Typical: 30-60 seconds
- **Bundle Size** - Monitor for increases
- **Test Duration** - ~6 seconds for full suite
- **Deploy Time** - 1-2 minutes to Firebase

### Success Indicators
```bash
✅ Prerequisites met
✅ Dependencies installed  
✅ Linting passed
✅ All tests passed (64/64)
✅ Build completed successfully
✅ Deployed to Firebase Hosting
🌐 Live at: https://your-project.web.app
```

## 🐛 Troubleshooting

### Common Issues

**Firebase CLI Not Found**
```bash
npm install -g firebase-tools
firebase login
```

**Authentication Issues**
```bash
firebase logout
firebase login
firebase projects:list
```

**Build Failures**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check for linting errors
npm run lint

# Run tests individually
npm run test:components
```

**Environment Variable Issues**
- Ensure `.env` file exists and is properly formatted
- Check variable names start with `REACT_APP_`
- Restart development server after changes
- Verify Firebase configuration values

**Port Conflicts (Development)**
```bash
# Use different port
PORT=3001 npm start

# Kill process using port 3000
lsof -ti:3000 | xargs kill -9
```

### Debug Commands
```bash
# Verbose Firebase deployment
firebase deploy --debug

# Check Firebase project
firebase use --add

# Test build locally
npm run build
npx serve -s build
```

## 🔄 CI/CD Integration

### GitHub Actions Example
```yaml
name: Deploy to Firebase
on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '16'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm run test:ci
      
      - name: Build
        run: npm run build
      
      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          projectId: your-project-id
```

## 🎯 Best Practices

### Pre-Deployment Checklist
- [ ] All tests passing locally
- [ ] No linting errors
- [ ] Environment variables configured
- [ ] Firebase project permissions verified
- [ ] Recent backup of production data

### Deployment Strategy
- **Development**: Deploy frequently for testing
- **Staging**: Test major changes before production
- **Production**: Deploy during low-traffic periods
- **Rollback**: Keep previous version available

### Performance Optimization
- Monitor bundle size after changes
- Use lazy loading for large components
- Optimize images and assets
- Enable Firebase Hosting compression

## 📈 Monitoring

### Post-Deployment Checks
1. **Functionality** - Test key features
2. **Performance** - Check load times
3. **Console Errors** - Monitor browser console
4. **Analytics** - Verify tracking works
5. **Authentication** - Test login/logout

### Firebase Console
- **Hosting** - Monitor traffic and performance
- **Authentication** - Check user activity
- **Firestore** - Monitor database usage
- **Functions** - Check function logs (if applicable)

## 📚 Related Documentation

- **[Setup Guide](SETUP.md)** - Initial configuration
- **[Development Guide](DEVELOPMENT.md)** - Development workflow
- **[Testing Guide](TESTING.md)** - Testing documentation

## 🆘 Getting Help

### Support Resources
- Check deployment script output for specific errors
- Review Firebase console for hosting issues
- Verify environment configuration
- Test locally before deploying to production

### Emergency Rollback
```bash
# Rollback to previous version
firebase hosting:clone SOURCE_SITE_ID:SOURCE_VERSION TARGET_SITE_ID

# Or redeploy previous version
git checkout previous-commit
npm run deploy:skip-tests
```