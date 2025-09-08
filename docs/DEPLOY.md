# 🚀 Deployment Guide

Complete deployment instructions for the Troop Manager application.

## 🎯 Quick Start

```bash
# Development server (recommended for daily work)
./run.sh dev --skip-tests       # Quick start
./run.sh dev                    # With full validation

# Production deployment (recommended)
./run.sh prod                   # Deploy with full validation
./run.sh prod --skip-tests      # Quick deployment

# Testing only
./run.sh tests                  # Run comprehensive test suite
```

### NPM Script Aliases
```bash
npm run dev                     # → ./run.sh dev
npm run dev:skip-tests          # → ./run.sh dev --skip-tests
npm run deploy                  # → ./run.sh prod
npm run deploy:skip-tests       # → ./run.sh prod --skip-tests
npm run test:all                # → ./run.sh tests
```

## 📋 Prerequisites

### Required Tools
- **Node.js** 16 or higher
- **npm** (comes with Node.js)
- **Firebase CLI**: `npm install -g firebase-tools`
- **Git** for version control

### Firebase Setup
- Firebase project with Hosting enabled
- Authentication configured
- Firestore database created
- Proper IAM permissions for service account

### Firebase Authentication
```bash
# Login to Firebase (for local deployment)
firebase login

# Verify access
firebase projects:list
```

## 🛠️ Run Script Features

The `run.sh` script is the main entry point for all development, testing, and deployment operations.

### 🔍 **Comprehensive Checks**
- ✅ Node.js version compatibility (16+)
- ✅ npm availability
- ✅ Dependency installation/updates
- ✅ ESLint code quality checks
- ✅ Complete test suite execution (87 tests)
- ✅ Coverage threshold validation (70% minimum)

### 🧪 **Test Suite Integration**
- **Component Tests** (44 tests) - UI functionality and user interactions
- **Service Tests** (16 tests) - Business logic and data processing
- **Integration Tests** (15 tests) - API calls and end-to-end workflows
- **Infrastructure Tests** (12 tests) - Test environment validation

### 🎨 **Beautiful Output**
- Color-coded status messages
- Progress indicators
- Clear error reporting
- Helpful next-step suggestions

### 📊 **Smart Deployment**
- Firebase hosting with build optimization
- Environment variable validation
- Service account authentication
- Live URL generation

## 🔄 Development Deployment

### Local Development Server
```bash
# Recommended: Quick start for daily development
./run.sh dev --skip-tests
npm run dev:skip-tests

# Full validation (slower but thorough)
./run.sh dev
npm run dev
```

**Development Process:**
1. **Prerequisites Check** - Validates Node.js, npm, and dependencies
2. **Dependency Installation** - Runs `npm ci` if needed
3. **Linting** - ESLint code quality checks
4. **Testing** - Full test suite (unless skipped)
5. **Start Server** - Launches development server

### Development Features
- **Hot Reload** - Automatic browser refresh on changes
- **Error Overlay** - In-browser error display
- **Source Maps** - Debug original source code
- **Fast Refresh** - Preserve component state during edits
- **Server URL** - Available at `http://localhost:3030`

## 🌐 Production Deployment

### Firebase Hosting Deployment
```bash
# Full deployment with validation (recommended)
./run.sh prod
npm run deploy

# Quick deployment (use with caution)
./run.sh prod --skip-tests
npm run deploy:skip-tests
```

**Production Process:**
1. **Prerequisites Check** - Node.js, npm, Firebase CLI, authentication
2. **Quality Gates** - Linting and comprehensive testing
3. **Build Process** - Creates optimized production build
4. **Firebase Deploy** - Uploads to Firebase Hosting
5. **Success Confirmation** - Shows live application URL

### Build Optimization
- **Code Splitting** - Lazy loading for better performance
- **Minification** - Compressed JavaScript and CSS
- **Asset Optimization** - Optimized images and fonts
- **Bundle Analysis** - Size monitoring and reporting

## ⚙️ Configuration

### Environment Variables
Production deployment requires proper environment configuration. See [GitHub Actions Setup](SETUP.md#github-actions-setup-cicd) for details.

#### Required GitHub Secrets:
```
REACT_APP_FIREBASE_API_KEY
REACT_APP_FIREBASE_APP_ID
REACT_APP_FIREBASE_MESSAGING_SENDER_ID
REACT_APP_FIREBASE_MEASUREMENT_ID
REACT_APP_GOOGLE_API_KEY
REACT_APP_EMAIL_WEBHOOK_URL
FIREBASE_SERVICE_ACCOUNT_TROOP_468_MANAGER
```

#### Required GitHub Variables:
```
REACT_APP_FIREBASE_AUTH_DOMAIN
REACT_APP_FIREBASE_PROJECT_ID
REACT_APP_FIREBASE_STORAGE_BUCKET
REACT_APP_GOOGLE_CALENDAR_ID
REACT_APP_GOOGLE_SHEETS_SHEET_ID
```

### Firebase Configuration
The project uses `firebase.json` for hosting configuration:
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
    ]
  }
}
```

## 🔍 Quality Gates

### Automated Checks
The deployment script includes several quality gates:

1. **Linting** - ESLint code quality validation
2. **Testing** - Full test suite (87 tests, 100% pass rate)
3. **Build Validation** - Successful production build
4. **Dependency Check** - All required tools available
5. **Firebase Authentication** - Valid service account permissions

### Bypassing Quality Gates
```bash
# Skip tests (use sparingly)
./run.sh dev --skip-tests
./run.sh prod --skip-tests

# The script shows warnings when skipping tests
```

## 📊 Deployment Monitoring

### Build Metrics
- **Build Time** - Typical: 30-60 seconds
- **Bundle Size** - ~331 kB (gzipped)
- **Test Duration** - ~6 seconds for full suite (87 tests)
- **Deploy Time** - 1-2 minutes to Firebase

### Success Indicators
```bash
✅ Node.js version v18.x.x is compatible
✅ npm is available
✅ Dependencies are up to date
✅ Linting passed
✅ All tests passed successfully! (87/87)
✅ Production build completed
✅ Deployed to Firebase Hosting
🌐 Live at: https://troop-468-manager.web.app
```

## 🐛 Troubleshooting

### Common Issues & Solutions

#### **Node.js Version Error**
```bash
❌ Node.js version 14 is too old
```
**Solution:** Upgrade to Node.js 16+
```bash
# Install from https://nodejs.org
# Or use nvm
nvm install 16
nvm use 16
```

#### **Firebase CLI Not Found**
```bash
❌ Firebase CLI is not installed
```
**Solution:** Install Firebase CLI
```bash
npm install -g firebase-tools
firebase login
```

#### **Firebase Authentication Issues**
```bash
❌ Not logged in to Firebase
```
**Solution:** Re-authenticate
```bash
firebase logout
firebase login
firebase projects:list
```

#### **Linting Errors**
```bash
❌ Linting failed
```
**Solution:** Fix code style issues
```bash
npm run build  # See detailed linting errors
```

#### **Test Failures**
```bash
❌ Some tests failed
```
**Solution:** Debug and fix tests
```bash
npm test -- --watchAll=false --verbose  # See detailed test output
./run.sh tests                          # Run tests only
```

#### **Build Failures**
```bash
❌ Production build failed
```
**Solution:** Clear cache and rebuild
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### **Environment Variable Issues**
- Ensure all required GitHub Secrets and Variables are set
- Check variable names match exactly
- Verify Firebase configuration values
- Test locally with `.env.local` file

#### **Port Conflicts (Development)**
```bash
# Kill process using port 3030
lsof -ti:3030 | xargs kill -9

# Or use different port
PORT=3031 ./run.sh dev
```

### Debug Commands
```bash
# Verbose Firebase deployment
firebase deploy --debug

# Check Firebase project status
firebase use
firebase projects:list

# Test build locally
npm run build
npx serve -s build
```

## 🔄 CI/CD Integration

### GitHub Actions
The project includes automated CI/CD workflows:

- **`firebase-hosting-merge.yml`** - Deploys to production on main branch
- **`firebase-hosting-pull-request.yml`** - Creates preview deployments for PRs
- **`test.yml`** - Runs comprehensive test suite on all pushes

### Workflow Features
- **Automated Testing** - All 87 tests run on every commit
- **Build Validation** - Ensures production builds succeed
- **Environment Variables** - Uses GitHub Secrets and Variables
- **Preview Deployments** - Test changes before merging
- **Security** - Service account authentication

## 🎯 Best Practices

### Development Workflow
```bash
# Daily development
./run.sh dev --skip-tests    # Quick start

# Before committing
./run.sh tests               # Verify all tests pass
npm run build                # Verify build works

# Before deploying
./run.sh prod                # Full validation and deployment
```

### Pre-Deployment Checklist
- [ ] All tests passing locally (`./run.sh tests`)
- [ ] No linting errors (`npm run build`)
- [ ] Environment variables configured in GitHub
- [ ] Firebase service account has proper permissions
- [ ] Recent backup of production data

### Deployment Strategy
- **Development**: Deploy frequently for testing
- **Pull Requests**: Automatic preview deployments
- **Production**: Deploy from main branch after thorough testing
- **Rollback**: Use Firebase console or redeploy previous commit

### Performance Optimization
- Monitor bundle size after changes
- Use lazy loading for large components
- Optimize images and assets
- Enable Firebase Hosting compression
- Review build output for warnings

## 📈 Monitoring

### Post-Deployment Checks
1. **Functionality** - Test key features (login, data loading, forms)
2. **Performance** - Check load times and responsiveness
3. **Console Errors** - Monitor browser console for JavaScript errors
4. **Authentication** - Verify Google login and user management
5. **Database** - Test Firestore read/write operations

### Firebase Console Monitoring
- **Hosting** - Monitor traffic, performance, and deployment history
- **Authentication** - Check user activity and sign-in methods
- **Firestore** - Monitor database usage and query performance
- **Performance** - Track app performance metrics

## 📚 Related Documentation

- **[Setup Guide](SETUP.md)** - Initial configuration and GitHub Actions setup
- **[Development Guide](DEVELOPMENT.md)** - Development workflow and best practices
- **[Testing Guide](TESTING.md)** - Comprehensive testing documentation

## 🆘 Getting Help

### Support Resources
- Check deployment script output for specific errors
- Review Firebase console for hosting and authentication issues
- Verify environment configuration in GitHub repository settings
- Test locally before deploying to production

### Emergency Rollback
```bash
# Method 1: Redeploy previous version
git checkout previous-commit
./run.sh prod --skip-tests

# Method 2: Use Firebase console
# Go to Firebase Console → Hosting → View deployment history → Rollback
```

### Contact Support
- Review error messages in deployment script output
- Check GitHub Actions logs for CI/CD issues
- Verify Firebase project permissions and quotas
- Test with minimal reproduction case

---

**🚀 Ready to deploy? Start with `./run.sh dev --skip-tests` for development or `./run.sh prod` for production!**