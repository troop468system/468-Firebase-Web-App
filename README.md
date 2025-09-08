# 🏕️ Troop Manager

A comprehensive web application for managing Boy Scout troop activities, built with React and Firebase.

## 🚀 Quick Start

```bash
# Development
./run.sh dev                    # Start dev server with tests
./run.sh dev --skip-tests       # Start dev server without tests
npm run dev                     # Alias for ./run.sh dev

# Production
./run.sh prod                   # Deploy with validation
./run.sh prod --skip-tests      # Deploy without tests
npm run deploy                  # Alias for ./run.sh prod

# Testing
./run.sh tests                  # Run comprehensive test suite
npm run test:all                # Alias for ./run.sh tests
npm test                        # Interactive testing
```

## 📁 Project Structure

```
TroopManager/
├── README.md                   # This file
├── run.sh                      # Main run script (dev/prod/tests)
├── docs/                       # 📚 Detailed documentation
├── testing/                    # 🧪 Test utilities
├── src/                        # 💻 Application code
│   ├── components/             # React components
│   ├── pages/                  # Application pages
│   ├── services/               # Business logic
│   └── __tests__/              # Test files
├── public/                     # Static assets
└── package.json                # Dependencies & scripts
```

## 🎯 Key Features

- **📧 Email Management** - Automated notifications and queue
- **📅 Calendar Integration** - Google Calendar events
- **👥 User Management** - Scout and leader profiles
- **📊 Activity Tracking** - Merit badges, training, events
- **🔐 Authentication** - Firebase Auth with Google
- **📱 Responsive Design** - Desktop and mobile

## 🛠️ Technology Stack

- **Frontend**: React 18, Material-UI, React Router
- **Backend**: Firebase (Auth, Firestore, Hosting)
- **APIs**: Google Calendar, Google Sheets
- **Testing**: Jest, React Testing Library (87 tests, 100% pass rate)

## 📚 Documentation

### **Getting Started**
- **[Setup Guide](docs/SETUP.md)** - Complete installation and configuration
- **[Development Guide](docs/DEVELOPMENT.md)** - Development workflow, authentication flows, and best practices

### **Quality Assurance**
- **[REAing Guide](docs/TESTING.md)** - Comprehensive testing documentation
- **[Deployment Guide](docs/DEPLOY.md)** - Production deployment instructions

### **Documentation Overview**

#### **[Setup Guide](docs/SETUP.md)**
Complete setup instructions including:
- Prerequisites and installation
- Firebase configuration
- Environment variables
- Verification steps

#### **[Development Guide](docs/DEVELOPMENT.md)**
Development workflow and best practices:
- **🔐 Complete Authentication Flows** (Registration, Account Setup, Password Reset)
- **📊 Visual Flow Diagrams** with Mermaid charts
- **🧪 Comprehensive Test Suite** with 90%+ coverage
- Project structure and organization
- Security considerations and error handling
- Code quality guidelines

#### **[Testing Guide](docs/TESTING.md)**
Comprehensive testing documentation:
- Test categories and structure
- Writing and running tests
- Test utilities and mocking (testUtils.js)
- Test orchestrator (test-runner.sh)
- Coverage and best practices

#### **[Deployment Guide](docs/DEPLOY.md)**
Production deployment instructions:
- Deployment script usage
- Quality gates and validation
- Firebase hosting setup
- Troubleshooting and monitoring

## ⚡ Prerequisites

- Node.js 16+
- Firebase CLI: `npm install -g firebase-tools`
- Firebase project with Auth and Firestore enabled

## 🎯 Getting Started

1. **Clone and Install**
```bash
   git clone <repository-url>
   cd TroopManager
   npm install
   ```

2. **Configure Environment**
   ```bash
   # Copy template and configure
   cp .env.example .env
   # Edit .env with your actual values (see .env.example for guidance)
   ```

3. **Start Development**
   ```bash
   npm run dev:skip-tests
   # Visit http://localhost:3030
   ```

4. **Deploy to Production**
```bash
   firebase login
   npm run deploy
   ```

## 🧪 Testing

- **87 tests** with **100% pass rate**
- **Component Tests** (44) - UI functionality
- **Service Tests** (16) - Business logic  
- **Integration Tests** (15) - API workflows
- **Infrastructure Tests** (12) - Test environment

Run tests: `npm run test:all` or see [Testing Guide](docs/TESTING.md)

## 🚀 Deployment

The `deploy.sh` script handles both development and production:

- **Development**: `npm run dev` - Local server with hot reload
- **Production**: `npm run deploy` - Build and deploy to Firebase
- **Quality Gates**: Automated testing and linting
- **Skip Tests**: Add `--skip-tests` flag for faster deployment

See [Deployment Guide](docs/DEPLOY.md) for details.

## 🤝 Contributing

1. **Setup**: `npm run dev:skip-tests`
2. **Develop**: Make changes in `src/`
3. **Test**: `npm run test:all`
4. **Deploy**: `npm run deploy`

See [Development Guide](docs/DEVELOPMENT.md) for workflow details.

## 🔗 External Resources

- **[Firebase Console](https://console.firebase.google.com)** - Backend management
- **[Google Cloud Console](https://console.cloud.google.com)** - API management
- **[React Documentation](https://reactjs.org/docs)** - React framework
- **[Material-UI](https://mui.com/)** - UI component library

## 📞 Support

1. **Check Documentation** - Review relevant guide above
2. **Run Diagnostics** - Use `./deploy.sh --help` for deployment options
3. **Test Environment** - Run `npm run test:all` to verify setup
4. **Check Logs** - Review browser console and Firebase logs

---

**Ready to start?** Run `npm run dev:skip-tests` and visit `http://localhost:3030`