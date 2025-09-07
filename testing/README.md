st# 🧪 Testing Directory

This directory contains all testing utilities and tools for the Troop Manager application.

## 📁 Directory Structure

```
testing/
├── README.md           # This file - testing utilities overview
├── testUtils.js        # Shared test utilities and mock data
└── test-runner.sh      # Comprehensive test runner script
```

## 🚀 Quick Start

### Run All Tests
```bash
# Comprehensive test runner (recommended)
./testing/test-runner.sh

# Or run by category
npm run test:components     # UI component tests
npm run test:integration    # API integration tests  
npm run test:services       # Business logic tests
```

### Coverage Report
```bash
npm run test:coverage
```

## 📋 Files Overview

### **testUtils.js**
Shared testing utilities and mock data for all test files.

**Key Exports:**
- `renderWithProviders()` - Render React components with providers
- `mockFetchSuccess()` / `mockFetchError()` - Mock API responses
- `mockUser`, `mockCalendarEvent`, `mockEmail` - Test data
- `wait()` - Async test helpers

### **test-runner.sh**
Comprehensive test orchestrator that runs:
- Linting checks
- Component tests
- Service tests  
- Integration tests
- Coverage analysis

## 🔧 Usage in Tests

### Import Utilities
```javascript
import { renderWithProviders, mockFetchSuccess } from '../testing/testUtils';

describe('MyComponent', () => {
  it('should work', async () => {
    global.fetch.mockResolvedValue(mockFetchSuccess({ success: true }));
    renderWithProviders(<MyComponent />);
    // ... test assertions
  });
});
```

### Mock API Responses
```javascript
// Success response
global.fetch.mockResolvedValue(mockFetchSuccess({ 
  success: true, 
  data: 'test' 
}));

// Error response
global.fetch.mockResolvedValue(mockFetchError('Network error', 500));
```

## 📊 Test Categories

### **Component Tests** (23 tests)
- UI functionality and user interactions
- Located in: `src/components/__tests__/`
- Run with: `npm run test:components`

### **Service Tests** (16 tests)  
- Business logic and data processing
- Located in: `src/services/__tests__/`
- Run with: `npm run test:services`

### **Integration Tests** (15 tests)
- API calls and end-to-end workflows
- Located in: `src/__tests__/integration/`
- Run with: `npm run test:integration`

## 🎯 Adding New Tests

1. **Component Test**: Create `src/components/__tests__/YourComponent.test.js`
2. **Service Test**: Create `src/services/__tests__/yourService.test.js`  
3. **Integration Test**: Create `src/__tests__/integration/yourIntegration.test.js`

All tests can import utilities from `../testing/testUtils.js` (adjust path as needed).

## 📈 Coverage Goals

- **Global**: 70% minimum coverage
- **Critical Components**: 85% coverage
- **Services**: 80% coverage
- **Integration**: 90% coverage

## 🔗 Related Documentation

- **[Testing Guide](../docs/TESTING.md)** - Comprehensive testing documentation
- **[Root README](../README.md)** - Project overview with testing commands

---

**Current Status**: 64/64 tests passing (100% success rate) ✅