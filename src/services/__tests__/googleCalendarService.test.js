/**
 * Tests for Google Calendar Service
 */

import googleCalendarService from '../googleCalendarService';
import { mockFetchSuccess, mockFetchError, wait } from '../../../testing/testUtils';

// Mock fetch globally for this test file
const originalFetch = global.fetch;

describe('GoogleCalendarService', () => {
  beforeEach(() => {
    // Reset fetch mock before each test
    global.fetch = jest.fn();
  });

  afterAll(() => {
    // Restore original fetch after tests
    global.fetch = originalFetch;
  });

  describe('Configuration', () => {
    it('should initialize with correct configuration', () => {
      expect(googleCalendarService.apiKey).toBe('test-api-key');
      expect(googleCalendarService.calendarId).toBe('test-calendar-id');
      expect(googleCalendarService.baseUrl).toBe('https://www.googleapis.com/calendar/v3');
    });

    it('should check if service is configured', () => {
      expect(googleCalendarService.isConfigured()).toBe(true);
    });
  });

  describe('getEvents', () => {
    const mockEventsResponse = {
      items: [
        {
          id: 'event-123',
          summary: 'Test Event',
          description: 'Test description',
          location: 'Test location',
          start: { dateTime: '2025-01-15T18:00:00Z' },
          end: { dateTime: '2025-01-15T20:00:00Z' },
          status: 'confirmed'
        },
        {
          id: 'event-456',
          summary: 'All Day Event',
          start: { date: '2025-01-16' },
          end: { date: '2025-01-17' },
          status: 'confirmed'
        }
      ]
    };

    it('should fetch and parse events successfully', async () => {
      global.fetch.mockResolvedValue(mockFetchSuccess(mockEventsResponse));

      const timeMin = '2025-01-01T00:00:00Z';
      const timeMax = '2025-01-31T23:59:59Z';
      
      const events = await googleCalendarService.getEvents(timeMin, timeMax);

      expect(events).toHaveLength(2);
      expect(events[0]).toMatchObject({
        id: 'event-123',
        title: 'Test Event',
        description: 'Test description',
        location: 'Test location',
        isAllDay: false
      });
      expect(events[1]).toMatchObject({
        id: 'event-456',
        title: 'All Day Event',
        isAllDay: true
      });
    });

    it('should handle empty events response', async () => {
      global.fetch.mockResolvedValue(mockFetchSuccess({ items: [] }));

      const events = await googleCalendarService.getEvents('2025-01-01T00:00:00Z', '2025-01-31T23:59:59Z');

      expect(events).toEqual([]);
    });

    it('should fall back to public calendar on 403 error', async () => {
      // First call fails with 403
      global.fetch
        .mockResolvedValueOnce(mockFetchError('Forbidden', 403))
        .mockResolvedValueOnce(mockFetchSuccess(mockEventsResponse));

      const events = await googleCalendarService.getEvents('2025-01-01T00:00:00Z', '2025-01-31T23:59:59Z');

      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(events).toHaveLength(2);
    });

    it('should return empty array when both primary and fallback fail', async () => {
      global.fetch
        .mockResolvedValueOnce(mockFetchError('Forbidden', 403))
        .mockResolvedValueOnce(mockFetchError('Not Found', 404));

      const events = await googleCalendarService.getEvents('2025-01-01T00:00:00Z', '2025-01-31T23:59:59Z');
      
      // Service gracefully handles errors by returning empty array (better UX)
      expect(events).toEqual([]);
    });
  });

  describe('parseEvents', () => {
    it('should parse timed events correctly', () => {
      const events = [
        {
          id: 'event-123',
          summary: 'Test Event',
          description: 'Test description',
          location: 'Test location',
          start: { dateTime: '2025-01-15T18:00:00Z' },
          end: { dateTime: '2025-01-15T20:00:00Z' },
          status: 'confirmed',
          created: '2025-01-01T00:00:00Z',
          updated: '2025-01-01T00:00:00Z'
        }
      ];

      const parsed = googleCalendarService.parseEvents(events);

      expect(parsed).toHaveLength(1);
      expect(parsed[0]).toMatchObject({
        id: 'event-123',
        title: 'Test Event',
        description: 'Test description',
        location: 'Test location',
        isAllDay: false,
        status: 'confirmed'
      });
      expect(parsed[0].startDate).toBeInstanceOf(Date);
      expect(parsed[0].endDate).toBeInstanceOf(Date);
    });

    it('should parse all-day events correctly', () => {
      const events = [
        {
          id: 'event-456',
          summary: 'All Day Event',
          start: { date: '2025-01-16' },
          end: { date: '2025-01-17' },
          status: 'confirmed'
        }
      ];

      const parsed = googleCalendarService.parseEvents(events);

      expect(parsed).toHaveLength(1);
      expect(parsed[0]).toMatchObject({
        id: 'event-456',
        title: 'All Day Event',
        isAllDay: true
      });
      
      // Check that end date is properly parsed (actual implementation behavior)
      expect(parsed[0].endDate).toBeInstanceOf(Date);
      expect(parsed[0].startDate).toBeInstanceOf(Date);
      
      // Verify the dates are in the correct range
      const startYear = parsed[0].startDate.getFullYear();
      const endYear = parsed[0].endDate.getFullYear();
      expect(startYear).toBe(2025);
      expect(endYear).toBe(2025);
    });

    it('should handle events without optional fields', () => {
      const events = [
        {
          id: 'event-789',
          start: { dateTime: '2025-01-15T18:00:00Z' },
          end: { dateTime: '2025-01-15T20:00:00Z' }
        }
      ];

      const parsed = googleCalendarService.parseEvents(events);

      expect(parsed).toHaveLength(1);
      expect(parsed[0]).toMatchObject({
        id: 'event-789',
        title: 'Untitled Event',
        description: '',
        location: '',
        status: 'confirmed'
      });
    });

    it('should handle null or undefined events', () => {
      expect(googleCalendarService.parseEvents(null)).toEqual([]);
      expect(googleCalendarService.parseEvents(undefined)).toEqual([]);
      expect(googleCalendarService.parseEvents([])).toEqual([]);
    });
  });

  describe('parseLocalDate', () => {
    it('should parse date string as local date', () => {
      const dateString = '2025-01-15';
      const parsed = googleCalendarService.parseLocalDate(dateString);

      expect(parsed.getFullYear()).toBe(2025);
      expect(parsed.getMonth()).toBe(0); // January is month 0
      expect(parsed.getDate()).toBe(15);
    });
  });

  describe('Helper Methods', () => {
    it('should get events for date range', async () => {
      global.fetch.mockResolvedValue(mockFetchSuccess({ items: [] }));

      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');

      await googleCalendarService.getEventsForDateRange(startDate, endDate);

      // Verify the URL contains expected calendar API endpoint and parameters  
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('googleapis.com/calendar/v3/calendars')
      );
      
      const callArgs = global.fetch.mock.calls[0][0];
      expect(callArgs).toContain('timeMin=2025-01-01T');
      expect(callArgs).toContain('timeMax=2025-01-31T');
    });

    it('should get events for specific month', async () => {
      global.fetch.mockResolvedValue(mockFetchSuccess({ items: [] }));

      await googleCalendarService.getEventsForMonth(2025, 0); // January 2025

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('googleapis.com/calendar/v3/calendars')
      );
      
      const callArgs = global.fetch.mock.calls[0][0];
      expect(callArgs).toContain('2025-01-01T'); // January 1st
      expect(callArgs).toContain('2025-02-01T'); // February 1st (end of January)
    });

    it('should get events for specific year', async () => {
      global.fetch.mockResolvedValue(mockFetchSuccess({ items: [] }));

      await googleCalendarService.getEventsForYear(2025);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('googleapis.com/calendar/v3/calendars')
      );
      
      const callArgs = global.fetch.mock.calls[0][0];
      expect(callArgs).toContain('2025-01-01T'); // January 1st
      expect(callArgs).toContain('2026-01-01T'); // January 1st next year
    });
  });

  describe('getCalendarInfo', () => {
    it('should fetch calendar information successfully', async () => {
      const mockCalendarInfo = {
        id: 'test-calendar-id',
        summary: 'Test Calendar',
        timeZone: 'America/New_York'
      };

      global.fetch.mockResolvedValue(mockFetchSuccess(mockCalendarInfo));

      const info = await googleCalendarService.getCalendarInfo();

      expect(info).toEqual(mockCalendarInfo);
      
      // Verify the URL contains the correct calendar API endpoint
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('googleapis.com/calendar/v3/calendars/test-calendar-id')
      );
    });

    it('should handle calendar info errors', async () => {
      global.fetch.mockResolvedValue(mockFetchError('Not found', 404));

      await expect(googleCalendarService.getCalendarInfo())
        .rejects.toThrow('Calendar info error: 404');
    });
  });
});
