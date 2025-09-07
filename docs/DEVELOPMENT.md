# 💻 Development Guide

Development workflow and best practices for the Troop Manager application.

## 🚀 Quick Start

```bash
# Start development server (recommended)
npm run dev:skip-tests

# Start with full testing
npm run dev

# Visit http://localhost:3000
```

## 📁 Project Structure

### Source Code Organization
```
src/
├── components/          # Reusable React components
│   ├── SimpleEmailTest.js
│   ├── SimpleCalendarTest.js
│   └── __tests__/       # Component tests
├── pages/              # Application pages/routes
│   ├── Dashboard.js
│   ├── Settings.js
│   └── ...
├── services/           # Business logic & API calls
│   ├── googleCalendarService.js
│   ├── authService.js
│   └── __tests__/      # Service tests
├── firebase.js         # Firebase configuration
└── App.js             # Main application component
```

### Key Directories
- **`components/`** - Reusable UI components
- **`pages/`** - Top-level page components
- **`services/`** - API integrations and business logic
- **`__tests__/`** - Test files (co-located with source)

## 🔄 Development Workflow

### 1. Feature Development
```bash
# Create feature branch
git checkout -b feature/your-feature

# Start development server
npm run dev:skip-tests

# Make changes in src/
# Test changes in browser
```

### 2. Testing
```bash
# Run specific test categories
npm run test:components     # UI components
npm run test:services       # Business logic
npm run test:integration    # API integration

# Run all tests
npm run test:all

# Interactive testing
npm test
```

### 3. Quality Checks
```bash
# Lint code
npm run lint

# Run full test suite with coverage
npm run test:coverage
```

### 4. Deployment
```bash
# Deploy with full validation
npm run deploy

# Quick deploy (skip tests)
npm run deploy:skip-tests
```

## 🧪 Testing Strategy

### Test Categories
- **Component Tests** (23) - UI functionality and user interactions
- **Service Tests** (16) - Business logic and data processing
- **Integration Tests** (15) - API calls and workflows
- **Infrastructure Tests** (10) - Test environment validation

### Writing Tests
```javascript
// Component test example
import { renderWithProviders, mockFetchSuccess } from '../testing/testUtils';
import MyComponent from '../MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    renderWithProviders(<MyComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

### Test Utilities
Located in `testing/testUtils.js`:
- `renderWithProviders()` - Render with React providers
- `mockFetchSuccess()` / `mockFetchError()` - Mock API responses
- Mock data: `mockUser`, `mockCalendarEvent`, `mockEmail`

## 🔧 Common Tasks

### Adding New Components
1. Create component in `src/components/YourComponent.js`
2. Create test file `src/components/__tests__/YourComponent.test.js`
3. Import and use in pages or other components

### Adding New Pages
1. Create page in `src/pages/YourPage.js`
2. Add route in `src/App.js`
3. Add navigation link if needed

### API Integration
1. Create service in `src/services/yourService.js`
2. Create test file `src/services/__tests__/yourService.test.js`
3. Use service in components

### Environment Variables
Add to `.env` file:
```env
REACT_APP_YOUR_VARIABLE=value
```

Access in code:
```javascript
const value = process.env.REACT_APP_YOUR_VARIABLE;
```

## 🎯 Best Practices

### Code Organization
- Keep components small and focused
- Use services for API calls and business logic
- Co-locate tests with source files
- Use meaningful file and function names

### Testing
- Write tests for new features
- Maintain 100% test pass rate
- Use descriptive test names
- Mock external dependencies

### Git Workflow
```bash
# Feature development
git checkout -b feature/description
# Make changes
git add .
git commit -m "feat: description"
git push origin feature/description

# Create pull request
# After review and merge
git checkout main
git pull origin main
```

### Performance
- Use React.memo for expensive components
- Lazy load pages with React.lazy()
- Optimize images and assets
- Monitor bundle size

## 🔍 Debugging

### Development Tools
- React Developer Tools browser extension
- Redux DevTools (if using Redux)
- Firebase console for backend debugging
- Browser network tab for API calls

### Common Issues
- **Port conflicts**: Use `PORT=3001 npm start`
- **Environment variables**: Restart server after changes
- **Firebase auth**: Check console for auth errors
- **API calls**: Check network tab and server logs

### Debug Commands
```bash
# Debug tests
npm run test:debug

# Verbose logging
DEBUG=* npm start

# Check bundle size
npm run build
npx serve -s build
```

## 📊 Code Quality

### Linting
```bash
# Run ESLint
npm run lint

# Fix auto-fixable issues
npm run lint:fix
```

### Testing Coverage
```bash
# Generate coverage report
npm run test:coverage

# View coverage report
open coverage/lcov-report/index.html
```

### Performance Monitoring
- Monitor build times
- Check bundle size after changes
- Profile components with React DevTools
- Monitor Firebase usage

## 🚀 Deployment Preparation

Before deploying:
1. Run full test suite: `npm run test:all`
2. Check linting: `npm run lint`
3. Test build: `npm run build`
4. Review changes in staging environment

## 📚 Related Documentation

- **[Setup Guide](SETUP.md)** - Initial setup and configuration
- **[Testing Guide](TESTING.md)** - Comprehensive testing documentation
- **[Deployment Guide](DEPLOY.md)** - Production deployment guide

## 🆘 Getting Help

- Check browser console for errors
- Review test output for failures
- Check Firebase console for backend issues
- Use React Developer Tools for component debugging
