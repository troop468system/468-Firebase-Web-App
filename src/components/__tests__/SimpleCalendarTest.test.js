/**
 * Tests for SimpleCalendarTest Component
 */

import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders, mockFetchSuccess, mockFetchError, mockGoogleScriptResponses, mockCalendarEvent } from '../../../testing/testUtils';
import SimpleCalendarTest from '../SimpleCalendarTest';

// Mock fetch globally for this test file
const originalFetch = global.fetch;

describe('SimpleCalendarTest Component', () => {
  beforeEach(() => {
    // Reset fetch mock before each test
    global.fetch = jest.fn();
  });

  afterAll(() => {
    // Restore original fetch after tests
    global.fetch = originalFetch;
  });

  it('renders calendar test component correctly', () => {
    renderWithProviders(<SimpleCalendarTest />);
    
    expect(screen.getByText('📅 Calendar Event Management')).toBeInTheDocument();
    expect(screen.getByText(/Create, modify, or delete calendar events/)).toBeInTheDocument();
    
    // Check for all four buttons
    expect(screen.getByRole('button', { name: /Create Event/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Modify Event/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Delete Event/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /List Events/i })).toBeInTheDocument();
  });

  describe('Create Event', () => {
    it('opens create dialog when create button is clicked', () => {
      renderWithProviders(<SimpleCalendarTest />);
      
      const createButton = screen.getByRole('button', { name: /Create Event/i });
      fireEvent.click(createButton);

      expect(screen.getByText('Create Calendar Event')).toBeInTheDocument();
      expect(screen.getByLabelText('Event Title')).toBeInTheDocument();
      expect(screen.getByLabelText('Description')).toBeInTheDocument();
      expect(screen.getByLabelText('Location')).toBeInTheDocument();
    });

    it('creates calendar event successfully', async () => {
      global.fetch.mockResolvedValue(mockFetchSuccess(mockGoogleScriptResponses.calendarCreateSuccess));

      renderWithProviders(<SimpleCalendarTest />);
      
      // Open create dialog
      const createButton = screen.getByRole('button', { name: /Create Event/i });
      fireEvent.click(createButton);

      // Fill form
      const titleInput = screen.getByLabelText('Event Title');
      fireEvent.change(titleInput, { target: { value: 'Test Event' } });

      // Submit form
      const submitButton = screen.getByRole('button', { name: /Create Event/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Calendar event created successfully/)).toBeInTheDocument();
      });

      // Verify fetch was called with correct type
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: expect.stringContaining('"type":"Calendar-Create"')
        })
      );
    });

    it('shows validation error for empty title', async () => {
      renderWithProviders(<SimpleCalendarTest />);
      
      // Open create dialog
      const createButton = screen.getByRole('button', { name: /Create Event/i });
      fireEvent.click(createButton);

      // Clear title and submit
      const titleInput = screen.getByLabelText('Event Title');
      fireEvent.change(titleInput, { target: { value: '' } });

      const submitButton = screen.getByRole('button', { name: /Create Event/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Event title is required/)).toBeInTheDocument();
      });
    });
  });

  describe('Modify Event', () => {
    it('opens modify dialog when modify button is clicked', () => {
      renderWithProviders(<SimpleCalendarTest />);
      
      const modifyButton = screen.getByRole('button', { name: /Modify Event/i });
      fireEvent.click(modifyButton);

      expect(screen.getByText('Modify Calendar Event')).toBeInTheDocument();
      expect(screen.getByLabelText('Event ID')).toBeInTheDocument();
      expect(screen.getByLabelText('New Title')).toBeInTheDocument();
    });

    it('modifies calendar event successfully', async () => {
      const modifyResponse = {
        success: true,
        operation: 'update',
        eventId: 'test-event-123',
        message: 'Calendar event updated successfully'
      };
      global.fetch.mockResolvedValue(mockFetchSuccess(modifyResponse));

      renderWithProviders(<SimpleCalendarTest />);
      
      // Open modify dialog
      const modifyButton = screen.getByRole('button', { name: /Modify Event/i });
      fireEvent.click(modifyButton);

      // Fill form
      const eventIdInput = screen.getByLabelText('Event ID');
      fireEvent.change(eventIdInput, { target: { value: 'test-event-123' } });

      // Submit form
      const submitButton = screen.getByRole('button', { name: /Modify Event/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Calendar event modified successfully/)).toBeInTheDocument();
      });
    });
  });

  describe('Delete Event', () => {
    it('opens delete dialog when delete button is clicked', () => {
      renderWithProviders(<SimpleCalendarTest />);
      
      const deleteButton = screen.getByRole('button', { name: /Delete Event/i });
      fireEvent.click(deleteButton);

      expect(screen.getByText('Delete Calendar Event')).toBeInTheDocument();
      expect(screen.getByLabelText('Event ID')).toBeInTheDocument();
      expect(screen.getByText(/This action cannot be undone/)).toBeInTheDocument();
    });

    it('deletes calendar event successfully', async () => {
      const deleteResponse = {
        success: true,
        operation: 'delete',
        eventId: 'test-event-123',
        message: 'Calendar event deleted successfully'
      };
      global.fetch.mockResolvedValue(mockFetchSuccess(deleteResponse));

      renderWithProviders(<SimpleCalendarTest />);
      
      // Open delete dialog
      const deleteButton = screen.getByRole('button', { name: /Delete Event/i });
      fireEvent.click(deleteButton);

      // Fill form
      const eventIdInput = screen.getByLabelText('Event ID');
      fireEvent.change(eventIdInput, { target: { value: 'test-event-123' } });

      // Submit form
      const submitButton = screen.getByRole('button', { name: /Delete Event/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Calendar event deleted successfully/)).toBeInTheDocument();
      });
    });
  });

  describe('List Events', () => {
    it('lists calendar events successfully', async () => {
      global.fetch.mockResolvedValue(mockFetchSuccess(mockGoogleScriptResponses.calendarListSuccess));

      renderWithProviders(<SimpleCalendarTest />);
      
      const listButton = screen.getByRole('button', { name: /List Events/i });
      fireEvent.click(listButton);

      await waitFor(() => {
        expect(screen.getByText(/Found 1 calendar events/)).toBeInTheDocument();
        expect(screen.getByText(/Test Event/)).toBeInTheDocument();
        expect(screen.getByText(/Copy the Event ID from above/)).toBeInTheDocument();
      });
    });

    it('handles empty event list', async () => {
      const emptyResponse = {
        ...mockGoogleScriptResponses.calendarListSuccess,
        events: [],
        count: 0
      };
      global.fetch.mockResolvedValue(mockFetchSuccess(emptyResponse));

      renderWithProviders(<SimpleCalendarTest />);
      
      const listButton = screen.getByRole('button', { name: /List Events/i });
      fireEvent.click(listButton);

      await waitFor(() => {
        expect(screen.getByText(/Found 0 calendar events/)).toBeInTheDocument();
        expect(screen.getByText(/No events found/)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles network errors', async () => {
      global.fetch.mockRejectedValue(new Error('Network error'));

      renderWithProviders(<SimpleCalendarTest />);
      
      const listButton = screen.getByRole('button', { name: /List Events/i });
      fireEvent.click(listButton);

      await waitFor(() => {
        expect(screen.getByText(/List events failed: Network error/)).toBeInTheDocument();
      });
    });

    it('handles API errors', async () => {
      global.fetch.mockResolvedValue(mockFetchSuccess(mockGoogleScriptResponses.error));

      renderWithProviders(<SimpleCalendarTest />);
      
      const listButton = screen.getByRole('button', { name: /List Events/i });
      fireEvent.click(listButton);

      await waitFor(() => {
        expect(screen.getByText(/List events failed: Test error message/)).toBeInTheDocument();
      });
    });

    it('handles HTTP errors', async () => {
      global.fetch.mockResolvedValue(mockFetchError('Server error', 500));

      renderWithProviders(<SimpleCalendarTest />);
      
      const listButton = screen.getByRole('button', { name: /List Events/i });
      fireEvent.click(listButton);

      await waitFor(() => {
        expect(screen.getByText(/List events failed: HTTP 500: Server error/)).toBeInTheDocument();
      });
    });
  });

  describe('Form Interactions', () => {
    it('toggles all-day event checkbox', () => {
      renderWithProviders(<SimpleCalendarTest />);
      
      // Open create dialog
      const createButton = screen.getByRole('button', { name: /Create Event/i });
      fireEvent.click(createButton);

      const allDayCheckbox = screen.getByRole('checkbox', { name: /All Day Event/i });
      
      // Should be unchecked by default
      expect(allDayCheckbox).not.toBeChecked();
      
      // Toggle checkbox
      fireEvent.click(allDayCheckbox);
      expect(allDayCheckbox).toBeChecked();
      
      // Time inputs should be hidden when all-day is checked
      expect(screen.queryByLabelText('Start Time')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('End Time')).not.toBeInTheDocument();
    });

    it('shows time inputs for timed events', () => {
      renderWithProviders(<SimpleCalendarTest />);
      
      // Open create dialog
      const createButton = screen.getByRole('button', { name: /Create Event/i });
      fireEvent.click(createButton);

      // Time inputs should be visible by default (not all-day)
      expect(screen.getByLabelText('Start Time')).toBeInTheDocument();
      expect(screen.getByLabelText('End Time')).toBeInTheDocument();
    });
  });
});
