/**
 * Test Setup and Configuration
 * This file configures the testing environment for the entire application
 */

// Import jest-dom matchers
import '@testing-library/jest-dom';

// Mock Firebase
jest.mock('./firebase.js', () => ({
  auth: {
    onAuthStateChanged: jest.fn(),
    signInWithPopup: jest.fn(),
    signOut: jest.fn(),
    currentUser: null
  },
  db: {
    collection: jest.fn(),
    doc: jest.fn()
  },
  googleProvider: {}
}));

// Mock Google APIs
global.gapi = {
  load: jest.fn((api, callback) => callback()),
  auth2: {
    getAuthInstance: jest.fn(() => ({
      signIn: jest.fn(),
      signOut: jest.fn(),
      isSignedIn: {
        get: jest.fn(() => false),
        listen: jest.fn()
      }
    }))
  }
};

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock console methods to reduce test noise
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Mock environment variables - Store originals and restore after tests
const originalEnv = process.env;
process.env = {
  ...originalEnv,
  REACT_APP_GOOGLE_API_KEY: 'test-api-key',
  REACT_APP_GOOGLE_CALENDAR_ID: 'test-calendar-id'
};

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};
