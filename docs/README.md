# 📚 Documentation

Comprehensive documentation for the Troop Manager application.

## 📁 Documentation Structure

```
docs/
├── README.md           # This file - documentation overview
├── SETUP.md           # Installation and configuration
├── DEVELOPMENT.md     # Development workflow and best practices
├── TESTING.md         # Testing guide and utilities documentation
└── DEPLOY.md          # Deployment instructions

../testing/
├── testUtils.js       # Shared test utilities (documented in TESTING.md)
└── test-runner.sh     # Test orchestrator (documented in TESTING.md)
```

## 🚀 Quick Navigation

### **Getting Started**
- **[Setup Guide](SETUP.md)** - Complete installation and configuration
- **[Development Guide](DEVELOPMENT.md)** - Development workflow and best practices

### **Quality Assurance**
- **[Testing Guide](TESTING.md)** - Comprehensive testing documentation
- **[Deployment Guide](DEPLOY.md)** - Production deployment instructions

## 📖 Documentation Overview

### **[Setup Guide](SETUP.md)**
Complete setup instructions including:
- Prerequisites and installation
- Firebase configuration
- Environment variables
- Verification steps

### **[Development Guide](DEVELOPMENT.md)**
Development workflow and best practices:
- Project structure
- Development workflow
- Testing strategy
- Code quality guidelines

### **[Testing Guide](TESTING.md)**
Comprehensive testing documentation:
- Test categories and structure
- Writing and running tests
- Test utilities and mocking (testUtils.js)
- Test orchestrator (test-runner.sh)
- Coverage and best practices

### **[Deployment Guide](DEPLOY.md)**
Production deployment instructions:
- Deployment script usage
- Quality gates and validation
- Firebase hosting setup
- Troubleshooting and monitoring

## 🎯 Quick Start Commands

### Development
```bash
npm run dev:skip-tests          # Quick start
npm run dev                     # With full testing
```

### Testing
```bash
npm run test:all                # Run all tests
npm run test:components         # UI components
npm run test:services           # Business logic
npm run test:integration        # API workflows
```

### Deployment
```bash
npm run deploy                  # Production with validation
npm run deploy:skip-tests       # Quick deployment
```

## 🧪 Testing Overview

**Current Status**: 64/64 tests passing (100% success rate)

- **Component Tests** (23) - UI functionality
- **Service Tests** (16) - Business logic
- **Integration Tests** (15) - API workflows
- **Infrastructure Tests** (10) - Test environment

## 🛠️ Key Technologies

- **Frontend**: React 18, Material-UI, React Router
- **Backend**: Firebase (Auth, Firestore, Hosting)
- **APIs**: Google Calendar, Google Sheets
- **Testing**: Jest, React Testing Library
- **Deployment**: Firebase Hosting with automated quality gates

## 📋 Project Status

✅ **Development Ready** - Full local development environment  
✅ **Production Ready** - Automated deployment pipeline  
✅ **Test Coverage** - 100% test pass rate  
✅ **Documentation** - Complete guides for all workflows  
✅ **Quality Assurance** - Automated linting and validation  

## 🔗 External Resources

- **[Firebase Console](https://console.firebase.google.com)** - Backend management
- **[Google Cloud Console](https://console.cloud.google.com)** - API management
- **[React Documentation](https://reactjs.org/docs)** - React framework
- **[Material-UI](https://mui.com/)** - UI component library

## 🆘 Getting Help

1. **Check Documentation** - Review relevant guide above
2. **Run Diagnostics** - Use `./deploy.sh --help` for deployment options
3. **Test Environment** - Run `npm run test:all` to verify setup
4. **Check Logs** - Review browser console and Firebase logs

---

**Need to get started?** Begin with the **[Setup Guide](SETUP.md)** 🚀