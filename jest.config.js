/**
 * Jest Configuration for Troop Manager
 */

module.exports = {
  // Use Create React App's Jest configuration as base
  preset: 'react-scripts',
  
  // Setup files to run before tests (CRA looks for setupTests.js by default)
  setupFilesAfterEnv: [
    '<rootDir>/src/setupTests.js'
  ],
  
  // Test environment
  testEnvironment: 'jsdom',
  
  // Modules to transform
  transformIgnorePatterns: [
    'node_modules/(?!(react-router|@mui|axios)/)'
  ],
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/index.js',
    '!src/reportWebVitals.js',
    '!src/**/__tests__/**',
    '!src/**/*.test.{js,jsx}',
    '!src/**/*.spec.{js,jsx}',
    '!src/**/*.stories.{js,jsx}'
  ],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    },
    // Higher thresholds for critical components
    'src/components/SimpleEmailTest.js': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    },
    'src/components/SimpleCalendarTest.js': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    },
    'src/services/googleCalendarService.js': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  
  // Coverage reporters
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov',
    'json-summary'
  ],
  
  // Test match patterns
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.test.{js,jsx}',
    '<rootDir>/src/**/*.test.{js,jsx}',
    '<rootDir>/src/**/*.spec.{js,jsx}'
  ],
  
  // Exclude utility files from being treated as tests
  testPathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/testing/'
  ],
  
  // Module name mapping for absolute imports
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@pages/(.*)$': '<rootDir>/src/pages/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1'
  },
  
  // Global test timeout
  testTimeout: 10000,
  
  // Verbose output for better debugging
  verbose: true,
  
  // Watch plugins for better development experience
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname'
  ],
  
  // Reporter configuration for CI/CD
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: './test-results',
        outputName: 'junit.xml',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
        ancestorSeparator: ' › '
      }
    ]
  ]
};
