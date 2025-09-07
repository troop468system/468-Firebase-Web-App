# 🧪 Testing Guide

Comprehensive testing documentation for the Troop Manager application.

## 🚀 Quick Start

```bash
# Run all tests
npm run test:all

# Run specific categories
npm run test:components     # UI components (23 tests)
npm run test:services       # Business logic (16 tests)
npm run test:integration    # API workflows (15 tests)

# Interactive testing
npm test

# Coverage report
npm run test:coverage
```

## 📊 Test Overview

**Current Status**: 64/64 tests passing (100% success rate)

### Test Categories
- **Component Tests** (23) - UI functionality and user interactions
- **Service Tests** (16) - Business logic and data processing
- **Integration Tests** (15) - API calls and end-to-end workflows
- **Infrastructure Tests** (10) - Test environment validation

## 🏗️ Test Structure

### Directory Organization
```
src/
├── components/
│   ├── SimpleEmailTest.js
│   └── __tests__/
│       ├── SimpleEmailTest.test.js
│       └── SimpleCalendarTest.test.js
├── services/
│   ├── googleCalendarService.js
│   └── __tests__/
│       └── googleCalendarService.test.js
└── __tests__/
    ├── TestSuite.test.js
    └── integration/
        └── googleAppsScriptIntegration.test.js

testing/
├── testUtils.js            # Shared utilities
└── test-runner.sh          # Test orchestrator
```

## 🛠️ Test Utilities

### Testing Directory Structure
```
testing/
├── testUtils.js        # Shared test utilities and mock data
└── test-runner.sh      # Comprehensive test runner script
```

### Shared Utilities (`testing/testUtils.js`)
```javascript
import { renderWithProviders, mockFetchSuccess } from '../testing/testUtils';

// Render components with providers
renderWithProviders(<MyComponent />);

// Mock successful API response
global.fetch.mockResolvedValue(mockFetchSuccess({ success: true }));

// Mock error response
global.fetch.mockResolvedValue(mockFetchError('Error message', 500));
```

### Available Utilities
- **`renderWithProviders()`** - Render React components with providers
- **`mockFetchSuccess(data)`** - Mock successful API responses
- **`mockFetchError(message, status)`** - Mock error responses
- **`wait(ms)`** - Async helper for timing
- **Mock Data**: `mockUser`, `mockCalendarEvent`, `mockEmail`

### Test Runner (`testing/test-runner.sh`)
Comprehensive test orchestrator that runs:
- **Linting checks** - ESLint code quality
- **Component tests** - UI functionality
- **Service tests** - Business logic
- **Integration tests** - API workflows
- **Coverage analysis** - Code coverage report

## ✍️ Writing Tests

### Component Tests
```javascript
import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders, mockFetchSuccess } from '../testing/testUtils';
import MyComponent from '../MyComponent';

describe('MyComponent', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch.mockRestore();
  });

  it('should render correctly', () => {
    renderWithProviders(<MyComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('should handle user interactions', async () => {
    global.fetch.mockResolvedValue(mockFetchSuccess({ success: true }));
    
    renderWithProviders(<MyComponent />);
    
    const button = screen.getByRole('button', { name: /click me/i });
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText('Success')).toBeInTheDocument();
    });
  });
});
```

### Service Tests
```javascript
import myService from '../myService';
import { mockFetchSuccess, mockFetchError } from '../testing/testUtils';

describe('MyService', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch.mockRestore();
  });

  it('should fetch data successfully', async () => {
    const mockData = { id: 1, name: 'Test' };
    global.fetch.mockResolvedValue(mockFetchSuccess(mockData));

    const result = await myService.getData();
    
    expect(result).toEqual(mockData);
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/data'));
  });

  it('should handle errors gracefully', async () => {
    global.fetch.mockResolvedValue(mockFetchError('Network error', 500));

    const result = await myService.getData();
    
    expect(result).toEqual([]);
  });
});
```

### Integration Tests
```javascript
import { mockFetchSuccess, mockGoogleScriptResponses } from '../testing/testUtils';

describe('API Integration', () => {
  it('should handle complete workflow', async () => {
    global.fetch.mockResolvedValue(mockFetchSuccess(mockGoogleScriptResponses.success));

    const payload = { type: 'TEST', data: 'test' };
    
    const response = await fetch('/api/endpoint', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    expect(result.success).toBe(true);
  });
});
```

## 🎯 Test Categories

### Component Tests
**Location**: `src/components/__tests__/`
**Purpose**: Test UI functionality and user interactions
**Examples**:
- Button clicks trigger correct actions
- Forms validate input correctly
- Components render with proper data
- Error states display appropriately

### Service Tests
**Location**: `src/services/__tests__/`
**Purpose**: Test business logic and data processing
**Examples**:
- API calls return expected data
- Error handling works correctly
- Data transformation is accurate
- Configuration is valid

### Integration Tests
**Location**: `src/__tests__/integration/`
**Purpose**: Test end-to-end workflows
**Examples**:
- Complete API request/response cycles
- Multiple services working together
- Error scenarios across system boundaries
- CORS and authentication flows

## 🏃‍♂️ Running Tests

### Command Reference
```bash
# All tests with orchestrator
npm run test:all

# Specific categories
npm run test:components
npm run test:services  
npm run test:integration

# Interactive mode
npm test

# Coverage report
npm run test:coverage

# Debug mode
npm run test:debug

# CI mode (non-interactive)
npm run test:ci
```

### Test Runner (`testing/test-runner.sh`)
Comprehensive orchestrator that runs:
1. **Prerequisites check** - Node.js, npm availability
2. **Linting** - ESLint code quality checks
3. **Component tests** - UI functionality
4. **Service tests** - Business logic
5. **Integration tests** - API workflows
6. **Coverage analysis** - Code coverage report

## 📊 Coverage Goals

### Current Coverage
- **Global**: Varies by component usage
- **Tested Components**: 85%+ coverage
- **Services**: 80%+ coverage
- **Critical Paths**: 90%+ coverage

### Coverage Commands
```bash
# Generate coverage report
npm run test:coverage

# View HTML report
open coverage/lcov-report/index.html

# CI coverage with thresholds
npm run test:ci
```

## 🔧 Configuration

### Jest Configuration (`jest.config.js`)
- **Test Environment**: jsdom for React components
- **Setup Files**: `src/setupTests.js` for global test setup
- **Test Patterns**: `**/__tests__/**/*.test.js`
- **Coverage**: Excludes `node_modules`, `build`, `testing/`

### Test Setup (`src/setupTests.js`)
```javascript
import '@testing-library/jest-dom';

// Mock environment variables
process.env.REACT_APP_FIREBASE_API_KEY = 'test-key';
// ... other mocks
```

## 🐛 Debugging Tests

### Debug Commands
```bash
# Debug specific test
npm run test:debug -- --testNamePattern="test name"

# Run single test file
npm test -- SimpleEmailTest.test.js

# Verbose output
npm test -- --verbose

# Watch mode
npm test -- --watch
```

### Common Issues
- **Import errors**: Check file paths and exports
- **Async issues**: Use `waitFor()` for async operations
- **Mock problems**: Ensure mocks are properly reset
- **Environment**: Check test environment variables

## 📈 Best Practices

### Test Writing
- Use descriptive test names
- Test behavior, not implementation
- Mock external dependencies
- Keep tests focused and isolated
- Use `arrange-act-assert` pattern

### Maintenance
- Run tests before committing
- Update tests when changing functionality
- Remove obsolete tests
- Keep test utilities up to date
- Monitor test performance

### CI/CD Integration
```bash
# In CI pipeline
npm ci                  # Install dependencies
npm run test:ci         # Run tests with coverage
npm run build           # Build if tests pass
```

## 🚀 Advanced Testing

### Custom Matchers
```javascript
// In setupTests.js
expect.extend({
  toBeValidEmail(received) {
    const pass = /\S+@\S+\.\S+/.test(received);
    return {
      message: () => `expected ${received} to be a valid email`,
      pass,
    };
  },
});
```

### Performance Testing
```javascript
import { performance } from 'perf_hooks';

it('should perform operation quickly', async () => {
  const start = performance.now();
  await myService.heavyOperation();
  const end = performance.now();
  
  expect(end - start).toBeLessThan(1000); // Less than 1 second
});
```

## 📚 Related Documentation

- **[Development Guide](DEVELOPMENT.md)** - Development workflow
- **[Setup Guide](SETUP.md)** - Initial setup
- **[Deployment Guide](DEPLOY.md)** - Production deployment

## 🆘 Troubleshooting

### Common Test Failures
- **Timeout errors**: Increase timeout or fix async handling
- **Mock issues**: Check mock setup and cleanup
- **Environment**: Verify test environment configuration
- **Dependencies**: Ensure all test dependencies are installed

### Getting Help
- Check test output for specific error messages
- Review test utilities documentation
- Verify mock data matches expected format
- Check component props and state