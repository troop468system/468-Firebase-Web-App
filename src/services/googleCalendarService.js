// Google Calendar Service - Simplified API Key Only
class GoogleCalendarService {
  constructor() {
    this.apiKey = process.env.REACT_APP_GOOGLE_API_KEY;
    this.calendarId = process.env.REACT_APP_GOOGLE_CALENDAR_ID || 'en.usa#holiday@group.v.calendar.google.com';
    this.baseUrl = 'https://www.googleapis.com/calendar/v3';
    this.fallbackCalendarId = 'en.usa#holiday@group.v.calendar.google.com'; // US Holidays (public)
    
    console.log('📅 Calendar service initialized with:', {
      hasApiKey: !!this.apiKey,
      calendarId: this.calendarId
    });
  }

  // Get events from the calendar
  async getEvents(timeMin, timeMax) {
    try {
      console.log('🗓️ Fetching calendar events with API key...');
      
      // Try primary calendar first
      const url = `${this.baseUrl}/calendars/${encodeURIComponent(this.calendarId)}/events?key=${this.apiKey}&timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`;
      
      console.log('Fetching calendar events from:', url);
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Found ${data.items?.length || 0} events from primary calendar`);
        return this.parseEvents(data.items || []);
      } else {
        const errorText = await response.text();
        console.error('Primary calendar failed:', response.status, errorText);
        
        // Fall back to public holiday calendar
        if (response.status === 401 || response.status === 403 || response.status === 404) {
          console.log('🔄 Falling back to public holiday calendar...');
          return await this.getFallbackEvents(timeMin, timeMax);
        }
        
        throw new Error(`Google Calendar API error: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error fetching calendar events:', error);
      
      // Try fallback calendar
      try {
        console.log('🔄 Attempting fallback calendar due to error...');
        return await this.getFallbackEvents(timeMin, timeMax);
      } catch (fallbackError) {
        console.error('❌ Fallback calendar also failed:', fallbackError);
        throw new Error(`No accessible calendar found`);
      }
    }
  }

  // Get events from fallback public calendar
  async getFallbackEvents(timeMin, timeMax) {
    try {
      const url = `${this.baseUrl}/calendars/${encodeURIComponent(this.fallbackCalendarId)}/events?key=${this.apiKey}&timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`;
      
      console.log('Fetching fallback calendar events from:', url);
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Found ${data.items?.length || 0} events from fallback calendar`);
        return this.parseEvents(data.items || []);
      } else {
        const errorText = await response.text();
        console.error('❌ Fallback calendar failed:', response.status, errorText);
        throw new Error(`Fallback calendar error: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error fetching fallback calendar:', error);
      return []; // Return empty array if fallback fails
    }
  }

  // Parse events from Google Calendar API response
  parseEvents(events) {
    if (!events || !Array.isArray(events)) {
      console.warn('⚠️ No events data or invalid format');
      return [];
    }

    console.log(`📅 Parsing ${events.length} events...`);

    return events.map(event => {
      const startTime = event.start?.dateTime || event.start?.date;
      const endTime = event.end?.dateTime || event.end?.date;
      
      let startDate, endDate;
      let isAllDay = false;

      if (event.start?.date && !event.start?.dateTime) {
        // All-day event - parse as local date to avoid timezone shifts
        isAllDay = true;
        startDate = this.parseLocalDate(event.start.date);
        endDate = this.parseLocalDate(event.end.date);
        
        // For all-day events, end date is exclusive in Google Calendar
        // Subtract one day to get the actual end date
        endDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
      } else {
        // Regular event with time
        startDate = new Date(startTime);
        endDate = new Date(endTime);
      }

      const parsedEvent = {
        id: event.id,
        title: event.summary || 'Untitled Event',
        description: event.description || '',
        location: event.location || '',
        startDate,
        endDate,
        isAllDay,
        status: event.status || 'confirmed',
        created: event.created ? new Date(event.created) : null,
        updated: event.updated ? new Date(event.updated) : null,
        htmlLink: event.htmlLink || '',
        creator: event.creator || {},
        organizer: event.organizer || {},
        originalEvent: event // Keep original for debugging
      };

      console.log(`📅 Parsed event: ${parsedEvent.title} (${parsedEvent.isAllDay ? 'All-day' : 'Timed'})`);
      
      return parsedEvent;
    });
  }

  // Parse date-only string as local date to avoid timezone issues
  parseLocalDate(dateString) {
    // dateString format: "YYYY-MM-DD"
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day); // month is 0-indexed in JS Date
  }

  // Get calendar information
  async getCalendarInfo() {
    try {
      const url = `${this.baseUrl}/calendars/${encodeURIComponent(this.calendarId)}?key=${this.apiKey}`;
      
      console.log('Fetching calendar info from:', url);
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Calendar info retrieved successfully');
        return data;
      } else {
        const errorText = await response.text();
        console.error('❌ Calendar info failed:', response.status, errorText);
        throw new Error(`Calendar info error: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error fetching calendar info:', error);
      throw error;
    }
  }

  // Check if the service is configured properly
  isConfigured() {
    return !!(this.apiKey && this.calendarId);
  }

  // Get events for a specific date range (helper method)
  async getEventsForDateRange(startDate, endDate) {
    const timeMin = startDate.toISOString();
    const timeMax = endDate.toISOString();
    
    return await this.getEvents(timeMin, timeMax);
  }

  // Get events for a specific month (helper method)
  async getEventsForMonth(year, month) {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);
    
    return await this.getEventsForDateRange(startDate, endDate);
  }

  // Get events for a specific year (helper method)
  async getEventsForYear(year) {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59, 999);
    
    return await this.getEventsForDateRange(startDate, endDate);
  }
}

// Export singleton instance
const googleCalendarService = new GoogleCalendarService();
export default googleCalendarService;
