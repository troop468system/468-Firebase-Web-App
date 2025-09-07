# 🚀 Deployment Guide

This guide covers how to use the comprehensive deployment script for development and production.

## 📋 Prerequisites

- **Node.js** version 16 or higher
- **npm** (comes with Node.js)
- **Firebase CLI** (for production deployment): `npm install -g firebase-tools`
- **Firebase login** (for production): `firebase login`

## 🎯 Quick Start

### Development Server
```bash
# Start development server with tests
npm run dev

# Start development server without tests (faster)
npm run dev:skip-tests

# Or use the script directly
./deploy.sh dev
./deploy.sh dev --skip-tests
```

### Production Deployment
```bash
# Deploy to production with full testing
npm run deploy

# Deploy without tests (not recommended)
npm run deploy:skip-tests

# Or use the script directly
./deploy.sh prod
./deploy.sh prod --skip-tests
```

## 🛠️ Script Features

### 🔍 **Comprehensive Checks**
- ✅ Node.js version compatibility (16+)
- ✅ npm availability
- ✅ Dependency installation/updates
- ✅ ESLint code quality checks
- ✅ Complete test suite execution
- ✅ Coverage threshold validation

### 🧪 **Test Suite Integration**
- **Component Tests** (23 tests) - UI functionality
- **Service Tests** (16 tests) - Business logic
- **Integration Tests** (15 tests) - API workflows
- **Coverage Analysis** - Minimum 70% threshold

### 🎨 **Beautiful Output**
- Color-coded status messages
- Progress indicators
- Clear error reporting
- Helpful next-step suggestions

## 📖 Usage Examples

### Development Workflow
```bash
# Standard development (recommended)
npm run dev
# → Runs tests, then starts dev server at http://localhost:3000

# Quick development (skip tests)
npm run dev:skip-tests  
# → Skips tests, starts dev server immediately

# Manual script usage
./deploy.sh dev --help
# → Shows all available options
```

### Production Deployment
```bash
# Standard production deployment (recommended)
npm run deploy
# → Full test suite → Build → Deploy to Firebase

# Quick deployment (skip tests)
npm run deploy:skip-tests
# → Skip tests → Build → Deploy (use with caution!)

# Step-by-step manual deployment
./deploy.sh prod
# → Full validation and deployment process
```

## 🎛️ Command Line Options

### Modes
- `dev` - Start development server (default)
- `prod` - Deploy to production

### Options
- `--skip-tests` - Skip running the test suite (works for both dev and prod)
- `--help` - Show usage information

### Examples
```bash
./deploy.sh dev                    # Dev server with tests
./deploy.sh dev --skip-tests       # Dev server without tests
./deploy.sh prod                   # Production with tests
./deploy.sh prod --skip-tests      # Production without tests
./deploy.sh --help                 # Show help
```

## 🔄 Development Workflow

### 1. **Daily Development**
```bash
# Start your day
npm run dev:skip-tests  # Quick start for development

# Before committing changes
npm run test:all        # Run full test suite
```

### 2. **Feature Development**
```bash
# Test specific areas while developing
npm run test:components    # Test UI changes
npm run test:services      # Test business logic
npm run test:integration   # Test API changes
```

### 3. **Pre-deployment**
```bash
# Full validation before deployment
npm run deploy  # This runs ALL checks before deploying
```

## 🚨 Error Handling

### Common Issues & Solutions

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
❌ Some tests failed: components services
```
**Solution:** Fix failing tests or skip tests
```bash
npm run test:components     # Debug specific test category
npm run deploy:skip-tests   # Deploy anyway (not recommended)
```

#### **Node.js Version**
```bash
❌ Node.js version 14 is too old
```
**Solution:** Upgrade Node.js
```bash
# Install Node.js 16+ from https://nodejs.org
```

#### **Firebase Not Logged In**
```bash
❌ Not logged in to Firebase
```
**Solution:** Login to Firebase
```bash
firebase login
```

## 📊 Test Coverage Requirements

The script enforces these coverage thresholds:

- **Global Minimum**: 70%
- **Critical Components**: 85%
  - SimpleEmailTest
  - SimpleCalendarTest
- **Services**: 80%
  - googleCalendarService

## 🎯 Production Deployment Process

When you run `npm run deploy`, here's what happens:

1. **Prerequisites Check** ✅
   - Node.js version validation
   - npm availability
   - Firebase CLI installation
   - Firebase authentication

2. **Code Quality** 🔍
   - Dependency installation/updates
   - ESLint code style validation

3. **Test Suite** 🧪
   - Component tests (UI functionality)
   - Service tests (business logic)
   - Integration tests (API workflows)
   - Coverage analysis (70% minimum)

4. **Build Process** 🏗️
   - Production bundle creation
   - Asset optimization
   - Build validation

5. **Deployment** 🌐
   - Firebase hosting deployment
   - Live URL generation
   - Success confirmation

## 🚀 Performance Tips

### Faster Development
```bash
# Skip tests during active development
npm run dev:skip-tests

# Run specific test categories
npm run test:components  # Only UI tests
```

### Reliable Deployment
```bash
# Always run full validation for production
npm run deploy  # Recommended approach

# Only skip tests when necessary
npm run deploy:skip-tests  # Use sparingly
```

## 🔧 Customization

### Modify Coverage Thresholds
Edit `deploy.sh` line 19:
```bash
MIN_COVERAGE=70  # Change to your desired percentage
```

### Add Custom Checks
Add your custom validation in the `main()` function:
```bash
# Add after line ~200
custom_validation() {
    # Your custom checks here
}
```

## 📈 Monitoring

### Development
- Server runs at `http://localhost:3000`
- Hot reload enabled
- Console shows build status

### Production
- Deployed to Firebase Hosting
- URL: `https://your-project-id.web.app`
- Firebase console for monitoring

## 🎉 Success Indicators

### Development Server Started
```bash
🔧 Starting development server...
Server will be available at: http://localhost:3000
```

### Production Deployment Complete
```bash
🎉 Deployment successful!
Your app is now live!
🔗 URL: https://your-project-id.web.app
```

---

**Need help?** Check the `testing/` directory for detailed testing documentation or run `./deploy.sh --help` for quick reference.
