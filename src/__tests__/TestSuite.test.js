/**
 * Test Suite Verification
 * This test ensures the testing infrastructure is working correctly
 */

import { renderWithProviders, mockUser, mockFetchSuccess, wait } from '../../testing/testUtils';

describe('Test Suite Infrastructure', () => {
  it('should have working test environment', () => {
    expect(true).toBe(true);
  });

  it('should have access to testing utilities', () => {
    expect(renderWithProviders).toBeDefined();
    expect(mockUser).toBeDefined();
    expect(mockFetchSuccess).toBeDefined();
    expect(wait).toBeDefined();
  });

  it('should have mocked environment variables', () => {
    // Since create-react-app loads env vars, let's just check they exist
    expect(process.env.REACT_APP_GOOGLE_API_KEY).toBeDefined();
    expect(process.env.REACT_APP_GOOGLE_CALENDAR_ID).toBeDefined();
  });

  it('should have mocked fetch available', () => {
    expect(global.fetch).toBeDefined();
    expect(typeof global.fetch).toBe('function');
  });

  it('should have mocked console methods', () => {
    expect(global.console.log).toBeDefined();
    expect(global.console.warn).toBeDefined();
    expect(global.console.error).toBeDefined();
  });

  it('should support async operations', async () => {
    await wait(10);
    expect(true).toBe(true);
  });

  it('should mock fetch responses correctly', async () => {
    const mockData = { success: true, message: 'Test response' };
    global.fetch = jest.fn().mockResolvedValue(mockFetchSuccess(mockData));

    const response = await fetch('https://example.com');
    const data = await response.json();

    expect(data).toEqual(mockData);
    expect(response.ok).toBe(true);
  });

  it('should have proper mock user data', () => {
    expect(mockUser).toMatchObject({
      uid: expect.any(String),
      email: expect.stringContaining('@'),
      displayName: expect.any(String)
    });
  });

  it('should support DOM testing', () => {
    const div = document.createElement('div');
    div.innerHTML = 'Test content';
    document.body.appendChild(div);

    expect(document.body.innerHTML).toContain('Test content');
    
    // Cleanup
    document.body.removeChild(div);
  });

  it('should have DOM manipulation capabilities', () => {
    const element = document.createElement('button');
    element.textContent = 'Click me';
    document.body.appendChild(element);

    // Basic DOM checks without specific testing library matchers
    expect(element.textContent).toBe('Click me');
    expect(document.body.contains(element)).toBe(true);

    // Cleanup
    document.body.removeChild(element);
  });
});
