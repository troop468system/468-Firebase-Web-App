/**
 * Tests for SimpleEmailTest Component
 */

import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders, mockFetchSuccess, mockFetchError, mockGoogleScriptResponses } from '../../../testing/testUtils';
import SimpleEmailTest from '../SimpleEmailTest';

// Mock fetch globally for this test file
const originalFetch = global.fetch;

describe('SimpleEmailTest Component', () => {
  beforeEach(() => {
    // Reset fetch mock before each test
    global.fetch = jest.fn();
  });

  afterAll(() => {
    // Restore original fetch after tests
    global.fetch = originalFetch;
  });

  it('renders email test component correctly', () => {
    renderWithProviders(<SimpleEmailTest />);
    
    expect(screen.getByText('📧 Email Integration Test')).toBeInTheDocument();
    expect(screen.getByText(/Test the email system by sending a sample email record/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Send Test Email/i })).toBeInTheDocument();
  });

  it('shows loading state when sending email', async () => {
    // Mock a delayed response
    global.fetch.mockImplementation(() => 
      new Promise(resolve => 
        setTimeout(() => resolve(mockFetchSuccess(mockGoogleScriptResponses.emailSuccess)), 100)
      )
    );

    renderWithProviders(<SimpleEmailTest />);
    
    const sendButton = screen.getByRole('button', { name: /Send Test Email/i });
    fireEvent.click(sendButton);

    // Check loading state
    expect(screen.getByText(/Sending Test Email/i)).toBeInTheDocument();
    expect(sendButton).toBeDisabled();

    // Wait for completion
    await waitFor(() => {
      expect(screen.queryByText(/Sending Test Email/i)).not.toBeInTheDocument();
    });
  });

  it('sends email successfully', async () => {
    global.fetch.mockResolvedValue(mockFetchSuccess(mockGoogleScriptResponses.emailSuccess));

    renderWithProviders(<SimpleEmailTest />);
    
    const sendButton = screen.getByRole('button', { name: /Send Test Email/i });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText(/SUCCESS! Email record sent to Google Sheets/)).toBeInTheDocument();
    });

    // Verify fetch was called with correct parameters
    expect(global.fetch).toHaveBeenCalledWith(
      'https://script.google.com/macros/s/AKfycbx9PRWvVJCEIqxivmz1PpT0yfjaM-LU5LqEfKWt-hBqwQIYYkaZdX2GiSYxynT2QLtK/exec',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: expect.stringContaining('"type":"TEST"')
      })
    );
  });

  it('handles email sending errors', async () => {
    global.fetch.mockResolvedValue(mockFetchError('Server error', 500));

    renderWithProviders(<SimpleEmailTest />);
    
    const sendButton = screen.getByRole('button', { name: /Send Test Email/i });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText(/Failed to send test email/)).toBeInTheDocument();
    });
  });

  it('handles API script errors', async () => {
    global.fetch.mockResolvedValue(mockFetchSuccess(mockGoogleScriptResponses.error));

    renderWithProviders(<SimpleEmailTest />);
    
    const sendButton = screen.getByRole('button', { name: /Send Test Email/i });
    fireEvent.click(sendButton);

    await waitFor(() => {
      // The component shows success message for HTTP 200, even if API returns success: false
      expect(screen.getByText(/SUCCESS! Email record sent to Google Sheets/)).toBeInTheDocument();
      expect(screen.getByText(/Success: false/)).toBeInTheDocument();
      expect(screen.getByText(/Test error message/)).toBeInTheDocument();
    });
  });

  it('sends correct payload format', async () => {
    global.fetch.mockResolvedValue(mockFetchSuccess(mockGoogleScriptResponses.emailSuccess));

    renderWithProviders(<SimpleEmailTest />);
    
    const sendButton = screen.getByRole('button', { name: /Send Test Email/i });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    const fetchCall = global.fetch.mock.calls[0];
    const payload = JSON.parse(fetchCall[1].body);

    // Verify payload structure
    expect(payload).toHaveProperty('type', 'TEST');
    expect(payload).toHaveProperty('to', 'test@troop468.com');
    expect(payload).toHaveProperty('cc', 'cc@troop468.com');
    expect(payload).toHaveProperty('subject');
    expect(payload).toHaveProperty('htmlBody');
    expect(payload).toHaveProperty('mon', 'true');
    expect(payload).toHaveProperty('tue', 'false');
    expect(payload).toHaveProperty('stopDate');
  });

  it('displays success response details', async () => {
    global.fetch.mockResolvedValue(mockFetchSuccess(mockGoogleScriptResponses.emailSuccess));

    renderWithProviders(<SimpleEmailTest />);
    
    const sendButton = screen.getByRole('button', { name: /Send Test Email/i });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText(/SUCCESS! Email record sent to Google Sheets/)).toBeInTheDocument();
      expect(screen.getByText(/Status: 200/)).toBeInTheDocument();
      expect(screen.getByText(/Success: true/)).toBeInTheDocument();
      expect(screen.getByText(/Repeat Days: Mon/)).toBeInTheDocument();
      expect(screen.getByText(/Google Sheet URL/)).toBeInTheDocument();
    });
  });

  it('handles network errors gracefully', async () => {
    global.fetch.mockRejectedValue(new Error('Network error'));

    renderWithProviders(<SimpleEmailTest />);
    
    const sendButton = screen.getByRole('button', { name: /Send Test Email/i });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText(/Failed to send test email: Network error/)).toBeInTheDocument();
    });
  });
});
