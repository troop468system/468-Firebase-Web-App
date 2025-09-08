# Security Testing Guide

This document outlines the comprehensive security testing suite for the Troop Manager application's password reset and authentication features.

## 🔒 Security Test Coverage

### Password Reset Security Tests

Our security testing covers all aspects of the enhanced password reset system:

#### 1. **Rate Limiting Tests**
- ✅ Validates rate limiting enforcement (5 attempts per 15 minutes)
- ✅ Tests rate limit bypass prevention
- ✅ Verifies graceful handling of rate limit failures
- ✅ Confirms proper error messages for rate-limited users

#### 2. **Password Strength Validation Tests**
- ✅ Strong password acceptance (`StrongPassword123!`)
- ✅ Weak password rejection with specific feedback
- ✅ Common password detection (`password`, `123456`, etc.)
- ✅ Real-time strength calculation and scoring
- ✅ Visual feedback component testing

#### 3. **Compromised Password Detection Tests**
- ✅ HaveIBeenPwned API integration testing
- ✅ Compromised password rejection with breach count
- ✅ Non-compromised password acceptance
- ✅ Graceful API failure handling

#### 4. **Email Domain Security Tests**
- ✅ Allowed domain validation (`gmail.com`, `troop468.com`)
- ✅ Suspicious domain blocking (`temp`, `fake`, short TLDs)
- ✅ Security event logging for blocked domains
- ✅ Enumeration attack prevention

#### 5. **Token Security Tests**
- ✅ Cryptographically secure token generation
- ✅ One-time use enforcement
- ✅ Expiration validation (1 hour for resets)
- ✅ Token flooding prevention (max 3 unused tokens)
- ✅ Automatic token invalidation after use

#### 6. **Audit Logging Tests**
- ✅ Security event logging with metadata
- ✅ IP address hashing for privacy compliance
- ✅ User agent and timestamp tracking
- ✅ Comprehensive attempt correlation

## 🧪 Test Categories

### Unit Tests

#### `authService.security.test.js`
Comprehensive unit tests for all security methods:

```bash
npm run test:security
```

**Coverage:**
- Rate limiting logic
- Password strength validation
- Compromised password detection
- Email domain validation
- IP hashing for privacy
- Security event logging
- Enhanced password reset flow
- New user registration security

### Component Tests

#### `ResetPassword.test.js`
Complete UI component testing:

```bash
npm run test:components
```

**Coverage:**
- Firebase reset flow
- Custom reset flow
- New user registration flow
- Password strength indicator UI
- Form validation
- Password visibility toggle
- Success/error handling
- Accessibility features

### Integration Tests

#### `passwordResetSecurity.test.js`
End-to-end security flow testing:

```bash
npm run test:integration
```

**Coverage:**
- Complete forgot password flow
- Security validation integration
- Token security integration
- User experience integration
- Error recovery integration
- Accessibility integration

## 🚀 Running Security Tests

### Quick Security Test Run
```bash
npm run test:security
```

### All Tests Including Security
```bash
npm run test:all
```

### Security Tests with Coverage
```bash
npm run test:coverage -- --testPathPattern="(ResetPassword|authService\.security|passwordResetSecurity)"
```

### Watch Mode for Development
```bash
npm run test:watch -- --testPathPattern="security"
```

## 📊 Test Scenarios

### 1. **Forgot Password Flow**
```javascript
// User enters email → Rate limit check → Domain validation → 
// Token generation → Email sending → Token validation → 
// Password strength check → Compromised password check → 
// Password reset completion → Token invalidation
```

### 2. **Security Attack Scenarios**
- **Rate Limit Attack**: Multiple rapid requests blocked
- **Token Flooding**: Excessive token generation prevented
- **Weak Password**: Rejected with specific feedback
- **Compromised Password**: Blocked with breach count
- **Suspicious Domain**: Blocked and logged
- **Token Reuse**: Prevented with one-time enforcement

### 3. **Edge Cases**
- Network failures during validation
- API timeouts for breach checking
- Malformed tokens and emails
- Expired and invalid tokens
- Database connection issues

## 🛡️ Security Assertions

Each test validates specific security requirements:

### Authentication Security
```javascript
expect(authService.checkRateLimit).toHaveBeenCalledWith(
  'test@example.com', 'PASSWORD_RESET', 5, 15
);
expect(authService.validatePasswordStrength).toHaveBeenCalledWith(password);
expect(authService.checkCompromisedPassword).toHaveBeenCalledWith(password);
```

### Token Security
```javascript
expect(tokenData).toMatchObject({
  used: false,
  expiresAt: expect.any(Date),
  userAgent: expect.any(String),
  ipHash: expect.any(String)
});
```

### Audit Logging
```javascript
expect(authService.logSecurityEvent).toHaveBeenCalledWith(
  email,
  'PASSWORD_RESET_REQUESTED',
  expect.any(Object)
);
```

## 📈 Security Metrics

Our tests validate these security metrics:

- **Rate Limiting**: 5 attempts per 15 minutes ✅
- **Token Expiration**: 1 hour maximum ✅
- **Password Strength**: 8+ chars, mixed case, numbers, symbols ✅
- **Breach Detection**: HaveIBeenPwned integration ✅
- **Domain Validation**: Suspicious pattern blocking ✅
- **Audit Coverage**: 100% security events logged ✅

## 🔧 Test Configuration

### Jest Configuration
```javascript
// jest.config.js
testMatch: [
  "**/__tests__/**/*.(js|jsx|ts|tsx)",
  "**/*.(test|spec).(js|jsx|ts|tsx)"
],
collectCoverageFrom: [
  "src/services/authService.js",
  "src/pages/ResetPassword.js"
]
```

### Security Test Environment
```javascript
// Mock external APIs for consistent testing
global.fetch = jest.fn();
global.crypto = { 
  subtle: { digest: jest.fn() },
  randomUUID: jest.fn(() => 'mock-uuid')
};
```

## 🎯 Security Test Goals

1. **Prevent Security Vulnerabilities**: Comprehensive testing prevents common attack vectors
2. **Validate Security Controls**: Each security measure is thoroughly tested
3. **Ensure Compliance**: Tests validate GDPR, SOC 2, and OWASP compliance
4. **Maintain Security**: Regression testing prevents security degradation
5. **Document Security**: Tests serve as security requirement documentation

## 📋 Security Test Checklist

Before deploying security features:

- [ ] All unit tests pass (`npm run test:security`)
- [ ] Integration tests pass (`npm run test:integration`)
- [ ] Component tests pass (`npm run test:components`)
- [ ] Coverage meets requirements (>90%)
- [ ] Security scenarios tested
- [ ] Edge cases covered
- [ ] Error handling validated
- [ ] Accessibility verified

## 🚨 Security Test Alerts

The test suite will fail if:

- Rate limiting is not enforced
- Weak passwords are accepted
- Compromised passwords are allowed
- Tokens can be reused
- Security events are not logged
- Domain validation is bypassed

## 📚 Related Documentation

- [Security Features Overview](./SECURITY.md)
- [Testing Guide](./TESTING.md)
- [Development Guide](./DEVELOPMENT.md)
- [Deployment Guide](./DEPLOY.md)

---

**Security is not optional** - our comprehensive test suite ensures that every security feature works correctly and continues to protect user data. 🔒
