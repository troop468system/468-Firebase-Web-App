/**
 * Test Utilities
 * Common utilities and helpers for testing
 */

import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';

// Create a test theme
const testTheme = createTheme();

/**
 * Custom render function that includes providers
 * @param {React.Component} ui - Component to render
 * @param {Object} options - Render options
 */
export function renderWithProviders(ui, options = {}) {
  function Wrapper({ children }) {
    return (
      <BrowserRouter>
        <ThemeProvider theme={testTheme}>
          {children}
        </ThemeProvider>
      </BrowserRouter>
    );
  }

  return render(ui, { wrapper: Wrapper, ...options });
}

/**
 * Mock user data for testing
 */
export const mockUser = {
  uid: 'test-user-123',
  email: 'test@troop468.com',
  displayName: 'Test User',
  photoURL: 'https://example.com/photo.jpg'
};

/**
 * Mock calendar event data
 */
export const mockCalendarEvent = {
  id: 'test-event-123',
  title: 'Test Event',
  description: 'Test event description',
  location: 'Test Location',
  startDate: '2025-01-15',
  startTime: '18:00',
  endDate: '2025-01-15',
  endTime: '20:00',
  isAllDay: false
};

/**
 * Mock email data
 */
export const mockEmail = {
  type: 'TEST',
  to: 'test@troop468.com',
  cc: 'cc@troop468.com',
  subject: 'Test Email',
  htmlBody: '<p>Test email content</p>',
  mon: 'true',
  tue: 'false',
  wed: 'false',
  thu: 'false',
  fri: 'false',
  sat: 'false',
  sun: 'false',
  stopDate: '2025-09-06T00:00:00.000Z'
};

/**
 * Mock Google Apps Script responses
 */
export const mockGoogleScriptResponses = {
  emailSuccess: {
    success: true,
    processed: 1,
    message: 'Successfully processed email records',
    timestamp: '2025-01-15T12:00:00.000Z'
  },
  calendarCreateSuccess: {
    success: true,
    operation: 'create',
    eventId: 'test-event-123',
    eventUrl: 'https://calendar.google.com/calendar/event?eid=test-event-123',
    message: 'Calendar event created successfully',
    eventDetails: mockCalendarEvent,
    timestamp: '2025-01-15T12:00:00.000Z'
  },
  calendarListSuccess: {
    success: true,
    operation: 'list',
    events: [mockCalendarEvent],
    count: 1,
    dateRange: {
      startDate: '2025-01-01',
      endDate: '2025-12-31'
    },
    message: 'Found 1 events in specified date range',
    timestamp: '2025-01-15T12:00:00.000Z'
  },
  error: {
    success: false,
    error: 'Test error message',
    message: 'Test error message', // Component looks for message field
    timestamp: '2025-01-15T12:00:00.000Z'
  }
};

/**
 * Mock successful fetch response
 * @param {Object} data - Response data
 */
export function mockFetchSuccess(data) {
  return Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data))
  });
}

/**
 * Mock failed fetch response
 * @param {string} errorMessage - Error message
 * @param {number} status - HTTP status code
 */
export function mockFetchError(errorMessage = 'Network error', status = 500) {
  return Promise.resolve({
    ok: false,
    status,
    statusText: errorMessage,
    text: () => Promise.resolve(errorMessage)
  });
}

/**
 * Wait for async operations to complete
 * @param {number} ms - Milliseconds to wait
 */
export function wait(ms = 0) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Mock console methods for testing
 */
export function mockConsole() {
  const originalConsole = { ...console };
  
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.log.mockRestore();
    console.warn.mockRestore();
    console.error.mockRestore();
  });

  return originalConsole;
}

/**
 * Create mock Firebase user
 * @param {Object} overrides - User property overrides
 */
export function createMockUser(overrides = {}) {
  return {
    ...mockUser,
    ...overrides
  };
}
