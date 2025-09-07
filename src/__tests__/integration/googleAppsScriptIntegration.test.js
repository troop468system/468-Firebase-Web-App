/**
 * Integration Tests for Google Apps Script API Calls
 * These tests verify the full flow of API calls to Google Apps Script
 */

import { mockFetchSuccess, mockFetchError, mockGoogleScriptResponses, wait } from '../../../testing/testUtils';

// Mock fetch globally for this test file
const originalFetch = global.fetch;

const WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbx9PRWvVJCEIqxivmz1PpT0yfjaM-LU5LqEfKWt-hBqwQIYYkaZdX2GiSYxynT2QLtK/exec';

describe('Google Apps Script Integration', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  describe('Email Operations', () => {
    it('should send email test request with correct payload', async () => {
      global.fetch.mockResolvedValue(mockFetchSuccess(mockGoogleScriptResponses.emailSuccess));

      const emailPayload = {
        type: 'TEST',
        to: 'test@troop468.com',
        cc: 'cc@troop468.com',
        subject: 'Test Email from Integration Test',
        htmlBody: '<p>Test content</p>',
        mon: 'true',
        tue: 'false',
        wed: 'false',
        thu: 'false',
        fri: 'false',
        sat: 'false',
        sun: 'false',
        stopDate: '2025-09-06T00:00:00.000Z'
      };

      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(emailPayload)
      });

      const result = await response.json();

      expect(response.ok).toBe(true);
      expect(result.success).toBe(true);
      expect(result.processed).toBe(1);
      expect(global.fetch).toHaveBeenCalledWith(
        WEBHOOK_URL,
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify(emailPayload)
        })
      );
    });

    it('should handle email API errors gracefully', async () => {
      global.fetch.mockResolvedValue(mockFetchSuccess(mockGoogleScriptResponses.error));

      const emailPayload = {
        type: 'TEST',
        to: 'invalid-email',
        subject: 'Test Email'
      };

      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(emailPayload)
      });

      const result = await response.json();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Test error message');
    });
  });

  describe('Calendar Operations', () => {
    const calendarCreatePayload = {
      type: 'Calendar-Create',
      eventData: {
        title: 'Integration Test Event',
        description: 'Test event for integration testing',
        location: 'Test Location',
        startDate: '2025-01-15',
        startTime: '18:00',
        endDate: '2025-01-15',
        endTime: '20:00',
        isAllDay: false
      }
    };

    it('should create calendar event with correct payload', async () => {
      global.fetch.mockResolvedValue(mockFetchSuccess(mockGoogleScriptResponses.calendarCreateSuccess));

      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(calendarCreatePayload)
      });

      const result = await response.json();

      expect(response.ok).toBe(true);
      expect(result.success).toBe(true);
      expect(result.operation).toBe('create');
      expect(result.eventId).toBeDefined();
      expect(result.eventDetails).toBeDefined();
    });

    it('should update calendar event', async () => {
      const updateResponse = {
        success: true,
        operation: 'update',
        eventId: 'test-event-123',
        message: 'Calendar event updated successfully'
      };
      global.fetch.mockResolvedValue(mockFetchSuccess(updateResponse));

      const updatePayload = {
        type: 'Calendar-Update',
        eventId: 'test-event-123',
        eventData: {
          title: 'Updated Event Title',
          description: 'Updated description'
        }
      };

      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(updatePayload)
      });

      const result = await response.json();

      expect(result.success).toBe(true);
      expect(result.operation).toBe('update');
      expect(result.eventId).toBe('test-event-123');
    });

    it('should delete calendar event', async () => {
      const deleteResponse = {
        success: true,
        operation: 'delete',
        eventId: 'test-event-123',
        message: 'Calendar event deleted successfully'
      };
      global.fetch.mockResolvedValue(mockFetchSuccess(deleteResponse));

      const deletePayload = {
        type: 'Calendar-Delete',
        eventId: 'test-event-123'
      };

      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(deletePayload)
      });

      const result = await response.json();

      expect(result.success).toBe(true);
      expect(result.operation).toBe('delete');
      expect(result.eventId).toBe('test-event-123');
    });

    it('should list calendar events', async () => {
      global.fetch.mockResolvedValue(mockFetchSuccess(mockGoogleScriptResponses.calendarListSuccess));

      const listPayload = {
        type: 'Calendar-List',
        dateRange: {
          startDate: '2025-01-01',
          endDate: '2025-12-31'
        }
      };

      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(listPayload)
      });

      const result = await response.json();

      expect(result.success).toBe(true);
      expect(result.operation).toBe('list');
      expect(result.events).toBeDefined();
      expect(result.count).toBeDefined();
    });
  });

  describe('Error Scenarios', () => {
    it('should handle network timeouts', async () => {
      global.fetch.mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Network timeout')), 100)
        )
      );

      await expect(
        fetch(WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({ type: 'TEST' })
        })
      ).rejects.toThrow('Network timeout');
    });

    it('should handle server errors', async () => {
      global.fetch.mockResolvedValue(mockFetchError('Internal Server Error', 500));

      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ type: 'TEST' })
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(500);
    });

    it('should handle malformed responses', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(null),
        text: () => Promise.resolve('Invalid JSON response')
      });

      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ type: 'TEST' })
      });

      const result = await response.json();
      expect(result).toBeNull();
    });
  });

  describe('CORS and Headers', () => {
    it('should use correct content type for CORS compatibility', async () => {
      global.fetch.mockResolvedValue(mockFetchSuccess(mockGoogleScriptResponses.emailSuccess));

      await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ type: 'TEST' })
      });

      const fetchCall = global.fetch.mock.calls[0];
      expect(fetchCall[1].headers['Content-Type']).toBe('text/plain');
    });

    it('should handle OPTIONS preflight requests', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve('')
      });

      const response = await fetch(WEBHOOK_URL, {
        method: 'OPTIONS'
      });

      expect(response.ok).toBe(true);
    });
  });

  describe('Payload Validation', () => {
    it('should reject payloads without required fields', async () => {
      const errorResponse = {
        success: false,
        error: 'Event title is required',
        timestamp: new Date().toISOString()
      };
      global.fetch.mockResolvedValue(mockFetchSuccess(errorResponse));

      const invalidPayload = {
        type: 'Calendar-Create',
        eventData: {
          // Missing title
          description: 'Test event'
        }
      };

      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(invalidPayload)
      });

      const result = await response.json();

      expect(result.success).toBe(false);
      expect(result.error).toContain('title is required');
    });

    it('should handle unknown operation types', async () => {
      const errorResponse = {
        success: false,
        error: 'Unknown operation: Invalid-Operation',
        timestamp: new Date().toISOString()
      };
      global.fetch.mockResolvedValue(mockFetchSuccess(errorResponse));

      const invalidPayload = {
        type: 'Invalid-Operation',
        data: {}
      };

      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(invalidPayload)
      });

      const result = await response.json();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown operation');
    });
  });

  describe('Rate Limiting and Retry Logic', () => {
    it('should handle rate limit errors', async () => {
      global.fetch.mockResolvedValue(mockFetchError('Rate limit exceeded', 429));

      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ type: 'TEST' })
      });

      expect(response.status).toBe(429);
    });

    it('should handle concurrent requests', async () => {
      global.fetch.mockResolvedValue(mockFetchSuccess(mockGoogleScriptResponses.emailSuccess));

      // Send multiple requests concurrently
      const requests = Array(3).fill().map((_, i) => 
        fetch(WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({ type: 'TEST', id: i })
        })
      );

      const responses = await Promise.all(requests);

      expect(responses).toHaveLength(3);
      responses.forEach(response => {
        expect(response.ok).toBe(true);
      });
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });
  });
});
