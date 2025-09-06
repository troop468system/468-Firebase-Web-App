/**
 * Google Apps Script - Calendar Manager for Troop 468
 * Dedicated script for calendar event operations (Create, Read, Update, Delete)
 * 
 * Features:
 * - Create calendar events
 * - Update existing events
 * - Delete events
 * - List events by date range
 * - Comprehensive logging to Google Sheets
 * 
 * Google Sheet Structure (CalendarOperations tab):
 * A: timestamp | B: operation | C: eventId | D: title | E: description | F: location | 
 * G: startDate | H: endDate | I: isAllDay | J: status | K: message | L: meta
 */

// Configuration
const CALENDAR_SHEET_ID = '1GX3U7UH28IcnNH2KQbVG-SVMBcGTmMa01QMEhGTicUM'; // Your Google Sheets ID
const CALENDAR_SHEET_NAME = 'CalendarOperations';
const CALENDAR_ID = 'primary'; // Use 'primary' for main calendar or specify a calendar ID

/**
 * Handle HTTP POST requests from React app
 */
function doPost(e) {
  try {
    console.log('📅 Calendar Manager - Received request');
    
    // Parse request data
    const requestData = JSON.parse(e.postData.contents);
    console.log('📦 Request data:', requestData);
    
    // Route request based on operation
    const { operation } = requestData;
    let response;
    
    switch (operation) {
      case 'create':
        response = createCalendarEvent(requestData.eventData);
        break;
      case 'update':
        response = updateCalendarEvent(requestData.eventId, requestData.eventData);
        break;
      case 'delete':
        response = deleteCalendarEvent(requestData.eventId);
        break;
      case 'list':
        response = listCalendarEvents(requestData.dateRange);
        break;
      case 'get':
        response = getCalendarEvent(requestData.eventId);
        break;
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
    
    console.log('✅ Request completed successfully:', response);
    
    // Return JSON response
    return ContentService
      .createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('❌ Error in doPost:', error);
    
    const errorResponse = {
      success: false,
      operation: requestData?.operation || 'unknown',
      error: error.toString(),
      timestamp: new Date().toISOString()
    };
    
    // Log error to sheets
    logOperation(requestData?.operation || 'ERROR', '', '', '', '', '', '', '', false, 'FAILED', error.toString());
    
    return ContentService
      .createTextOutput(JSON.stringify(errorResponse))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Create a calendar event
 * @param {Object} eventData - Event details
 * @returns {Object} Operation result
 */
function createCalendarEvent(eventData) {
  try {
    console.log('📅 Creating calendar event:', eventData);
    
    // Validate required fields
    if (!eventData.title) {
      throw new Error('Event title is required');
    }
    if (!eventData.startDate) {
      throw new Error('Start date is required');
    }
    
    // Get calendar
    const calendar = CalendarApp.getCalendarById(CALENDAR_ID) || CalendarApp.getDefaultCalendar();
    
    let createdEvent;
    const startDate = new Date(eventData.startDate);
    const endDate = new Date(eventData.endDate || eventData.startDate);
    
    if (eventData.isAllDay) {
      // All-day event
      // For all-day events, Calendar API expects end date to be next day
      const adjustedEndDate = new Date(endDate);
      adjustedEndDate.setDate(adjustedEndDate.getDate() + 1);
      
      createdEvent = calendar.createAllDayEvent(
        eventData.title,
        startDate,
        adjustedEndDate,
        {
          description: eventData.description || '',
          location: eventData.location || ''
        }
      );
    } else {
      // Timed event
      const startDateTime = new Date(`${eventData.startDate}T${eventData.startTime || '12:00'}`);
      const endDateTime = new Date(`${eventData.endDate || eventData.startDate}T${eventData.endTime || '13:00'}`);
      
      createdEvent = calendar.createEvent(
        eventData.title,
        startDateTime,
        endDateTime,
        {
          description: eventData.description || '',
          location: eventData.location || ''
        }
      );
    }
    
    const eventId = createdEvent.getId();
    const eventUrl = `https://calendar.google.com/calendar/event?eid=${encodeURIComponent(eventId)}`;
    
    // Log successful creation
    logOperation(
      'CREATE',
      eventId,
      eventData.title,
      eventData.description || '',
      eventData.location || '',
      eventData.startDate,
      eventData.endDate || eventData.startDate,
      eventData.isAllDay || false,
      'SUCCESS',
      'Event created successfully'
    );
    
    console.log('✅ Calendar event created:', eventId);
    
    const response = {
      success: true,
      operation: 'create',
      eventId: eventId,
      eventUrl: eventUrl,
      message: 'Calendar event created successfully',
      eventDetails: {
        id: eventId,
        title: createdEvent.getTitle(),
        startTime: createdEvent.getStartTime(),
        endTime: createdEvent.getEndTime(),
        location: createdEvent.getLocation(),
        description: createdEvent.getDescription(),
        isAllDay: createdEvent.isAllDayEvent()
      },
      timestamp: new Date().toISOString()
    };
    
    return response;
    
  } catch (error) {
    console.error('❌ Error creating calendar event:', error);
    
    // Log failed attempt
    logOperation(
      'CREATE',
      '',
      eventData.title || 'Unknown',
      eventData.description || '',
      eventData.location || '',
      eventData.startDate || '',
      eventData.endDate || '',
      eventData.isAllDay || false,
      'FAILED',
      error.toString()
    );
    
    throw error;
  }
}

/**
 * Update a calendar event
 * @param {string} eventId - Event ID to update
 * @param {Object} eventData - Updated event details
 * @returns {Object} Operation result
 */
function updateCalendarEvent(eventId, eventData) {
  try {
    console.log('📝 Updating calendar event:', eventId, eventData);
    
    if (!eventId) {
      throw new Error('Event ID is required for update');
    }
    
    // Get calendar and event
    const calendar = CalendarApp.getCalendarById(CALENDAR_ID) || CalendarApp.getDefaultCalendar();
    const event = calendar.getEventById(eventId);
    
    if (!event) {
      throw new Error('Event not found');
    }
    
    // Update event properties
    if (eventData.title !== undefined) {
      event.setTitle(eventData.title);
    }
    
    if (eventData.description !== undefined) {
      event.setDescription(eventData.description);
    }
    
    if (eventData.location !== undefined) {
      event.setLocation(eventData.location);
    }
    
    // Update time if provided
    if (eventData.startDate || eventData.startTime) {
      if (eventData.isAllDay) {
        // Update all-day event
        const startDate = new Date(eventData.startDate || event.getStartTime());
        const endDate = new Date(eventData.endDate || eventData.startDate || event.getEndTime());
        // Adjust end date for all-day events
        endDate.setDate(endDate.getDate() + 1);
        
        event.setAllDayDate(startDate);
        if (eventData.endDate) {
          event.setAllDayDates(startDate, endDate);
        }
      } else {
        // Update timed event
        const currentStart = event.getStartTime();
        const currentEnd = event.getEndTime();
        
        const startDateTime = eventData.startDate && eventData.startTime 
          ? new Date(`${eventData.startDate}T${eventData.startTime}`)
          : currentStart;
          
        const endDateTime = eventData.endDate && eventData.endTime
          ? new Date(`${eventData.endDate}T${eventData.endTime}`)
          : new Date(startDateTime.getTime() + (currentEnd.getTime() - currentStart.getTime()));
        
        event.setTime(startDateTime, endDateTime);
      }
    }
    
    // Log successful update
    logOperation(
      'UPDATE',
      eventId,
      eventData.title || event.getTitle(),
      eventData.description || event.getDescription(),
      eventData.location || event.getLocation(),
      eventData.startDate || event.getStartTime().toISOString().split('T')[0],
      eventData.endDate || event.getEndTime().toISOString().split('T')[0],
      eventData.isAllDay !== undefined ? eventData.isAllDay : event.isAllDayEvent(),
      'SUCCESS',
      'Event updated successfully'
    );
    
    console.log('✅ Calendar event updated:', eventId);
    
    const response = {
      success: true,
      operation: 'update',
      eventId: eventId,
      message: 'Calendar event updated successfully',
      eventDetails: {
        id: eventId,
        title: event.getTitle(),
        startTime: event.getStartTime(),
        endTime: event.getEndTime(),
        location: event.getLocation(),
        description: event.getDescription(),
        isAllDay: event.isAllDayEvent()
      },
      timestamp: new Date().toISOString()
    };
    
    return response;
    
  } catch (error) {
    console.error('❌ Error updating calendar event:', error);
    
    // Log failed attempt
    logOperation(
      'UPDATE',
      eventId || '',
      eventData.title || 'Unknown',
      '',
      '',
      '',
      '',
      false,
      'FAILED',
      error.toString()
    );
    
    throw error;
  }
}

/**
 * Delete a calendar event
 * @param {string} eventId - Event ID to delete
 * @returns {Object} Operation result
 */
function deleteCalendarEvent(eventId) {
  try {
    console.log('🗑️ Deleting calendar event:', eventId);
    
    if (!eventId) {
      throw new Error('Event ID is required for deletion');
    }
    
    // Get calendar and event
    const calendar = CalendarApp.getCalendarById(CALENDAR_ID) || CalendarApp.getDefaultCalendar();
    const event = calendar.getEventById(eventId);
    
    if (!event) {
      throw new Error('Event not found');
    }
    
    const eventTitle = event.getTitle();
    const eventStart = event.getStartTime().toISOString().split('T')[0];
    
    // Delete the event
    event.deleteEvent();
    
    // Log successful deletion
    logOperation(
      'DELETE',
      eventId,
      eventTitle,
      '',
      '',
      eventStart,
      '',
      false,
      'SUCCESS',
      'Event deleted successfully'
    );
    
    console.log('✅ Calendar event deleted:', eventId);
    
    const response = {
      success: true,
      operation: 'delete',
      eventId: eventId,
      message: `Calendar event "${eventTitle}" deleted successfully`,
      timestamp: new Date().toISOString()
    };
    
    return response;
    
  } catch (error) {
    console.error('❌ Error deleting calendar event:', error);
    
    // Log failed attempt
    logOperation(
      'DELETE',
      eventId || '',
      'Unknown',
      '',
      '',
      '',
      '',
      false,
      'FAILED',
      error.toString()
    );
    
    throw error;
  }
}

/**
 * Get a specific calendar event
 * @param {string} eventId - Event ID to retrieve
 * @returns {Object} Operation result with event details
 */
function getCalendarEvent(eventId) {
  try {
    console.log('📄 Getting calendar event:', eventId);
    
    if (!eventId) {
      throw new Error('Event ID is required');
    }
    
    // Get calendar and event
    const calendar = CalendarApp.getCalendarById(CALENDAR_ID) || CalendarApp.getDefaultCalendar();
    const event = calendar.getEventById(eventId);
    
    if (!event) {
      throw new Error('Event not found');
    }
    
    const eventDetails = {
      id: eventId,
      title: event.getTitle(),
      description: event.getDescription(),
      location: event.getLocation(),
      startTime: event.getStartTime(),
      endTime: event.getEndTime(),
      isAllDay: event.isAllDayEvent(),
      created: event.getDateCreated(),
      lastUpdated: event.getLastUpdated()
    };
    
    // Log successful retrieval
    logOperation(
      'GET',
      eventId,
      event.getTitle(),
      '',
      '',
      event.getStartTime().toISOString().split('T')[0],
      '',
      event.isAllDayEvent(),
      'SUCCESS',
      'Event retrieved successfully'
    );
    
    console.log('✅ Calendar event retrieved:', eventId);
    
    const response = {
      success: true,
      operation: 'get',
      eventId: eventId,
      event: eventDetails,
      message: 'Calendar event retrieved successfully',
      timestamp: new Date().toISOString()
    };
    
    return response;
    
  } catch (error) {
    console.error('❌ Error getting calendar event:', error);
    
    // Log failed attempt
    logOperation(
      'GET',
      eventId || '',
      'Unknown',
      '',
      '',
      '',
      '',
      false,
      'FAILED',
      error.toString()
    );
    
    throw error;
  }
}

/**
 * List calendar events within a date range
 * @param {Object} dateRange - Date range with startDate and endDate
 * @returns {Object} Operation result with events list
 */
function listCalendarEvents(dateRange = {}) {
  try {
    console.log('📋 Listing calendar events:', dateRange);
    
    // Default to next 7 days if no range provided
    const now = new Date();
    const startDate = dateRange.startDate ? new Date(dateRange.startDate) : now;
    const endDate = dateRange.endDate ? new Date(dateRange.endDate) : new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    // Get calendar
    const calendar = CalendarApp.getCalendarById(CALENDAR_ID) || CalendarApp.getDefaultCalendar();
    
    // Get events in date range
    const events = calendar.getEvents(startDate, endDate);
    
    const eventList = events.map(event => ({
      id: event.getId(),
      title: event.getTitle(),
      description: event.getDescription(),
      location: event.getLocation(),
      startTime: event.getStartTime(),
      endTime: event.getEndTime(),
      isAllDay: event.isAllDayEvent(),
      created: event.getDateCreated(),
      lastUpdated: event.getLastUpdated()
    }));
    
    // Log successful listing
    logOperation(
      'LIST',
      '',
      `${eventList.length} events`,
      '',
      '',
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0],
      false,
      'SUCCESS',
      `Listed ${eventList.length} events`
    );
    
    console.log(`✅ Found ${eventList.length} events in date range`);
    
    const response = {
      success: true,
      operation: 'list',
      events: eventList,
      count: eventList.length,
      dateRange: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      },
      message: `Found ${eventList.length} events in specified date range`,
      timestamp: new Date().toISOString()
    };
    
    return response;
    
  } catch (error) {
    console.error('❌ Error listing calendar events:', error);
    
    // Log failed attempt
    logOperation(
      'LIST',
      '',
      'Unknown',
      '',
      '',
      dateRange.startDate || '',
      dateRange.endDate || '',
      false,
      'FAILED',
      error.toString()
    );
    
    throw error;
  }
}

/**
 * Log calendar operations to Google Sheets
 * @param {string} operation - Operation type (CREATE, UPDATE, DELETE, etc.)
 * @param {string} eventId - Event ID
 * @param {string} title - Event title
 * @param {string} description - Event description
 * @param {string} location - Event location
 * @param {string} startDate - Start date
 * @param {string} endDate - End date
 * @param {boolean} isAllDay - Is all-day event
 * @param {string} status - Operation status (SUCCESS, FAILED)
 * @param {string} message - Additional message
 */
function logOperation(operation, eventId, title, description, location, startDate, endDate, isAllDay, status, message) {
  try {
    console.log('📊 Logging calendar operation to Google Sheets...');
    
    // Open the spreadsheet
    const spreadsheet = SpreadsheetApp.openById(CALENDAR_SHEET_ID);
    let sheet = spreadsheet.getSheetByName(CALENDAR_SHEET_NAME);
    
    // Create CalendarOperations sheet if it doesn't exist
    if (!sheet) {
      console.log('📋 Creating CalendarOperations sheet...');
      sheet = spreadsheet.insertSheet(CALENDAR_SHEET_NAME);
      
      // Add headers
      const headers = [
        'timestamp', 'operation', 'eventId', 'title', 'description', 'location',
        'startDate', 'endDate', 'isAllDay', 'status', 'message', 'meta'
      ];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      
      // Format header row
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#E3F2FD');
      
      console.log('✅ CalendarOperations sheet created with headers');
    }
    
    // Prepare data row
    const timestamp = new Date().toISOString();
    const sheetRow = [
      timestamp,                    // A: timestamp
      operation || '',              // B: operation
      eventId || '',               // C: eventId
      title || '',                 // D: title
      description || '',           // E: description
      location || '',              // F: location
      startDate || '',             // G: startDate
      endDate || '',               // H: endDate
      isAllDay || false,           // I: isAllDay
      status || 'UNKNOWN',         // J: status
      message || '',               // K: message
      JSON.stringify({             // L: meta
        source: 'CalendarManager',
        processedAt: timestamp,
        calendarId: CALENDAR_ID
      })
    ];
    
    // Add row to sheet
    const startRow = sheet.getLastRow() + 1;
    const range = sheet.getRange(startRow, 1, 1, sheetRow.length);
    range.setValues([sheetRow]);
    
    console.log(`📊 Added operation log at row ${startRow}`);
    
    // Auto-resize columns for better readability (but not too often for performance)
    if (startRow <= 10) {
      sheet.autoResizeColumns(1, sheetRow.length);
    }
    
  } catch (error) {
    console.error('❌ Error logging operation:', error);
    // Don't throw here as logging failure shouldn't break the main operation
  }
}

/**
 * Handle OPTIONS requests for CORS
 */
function doOptions(e) {
  console.log('🔄 CORS preflight request received');
  
  return ContentService
    .createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT);
}

/**
 * Test function - Create a sample event
 */
function testCreateEvent() {
  try {
    console.log('🧪 Testing event creation...');
    
    const testEventData = {
      title: 'Test Calendar Event - ' + new Date().getTime(),
      description: 'This is a test event created by the Calendar Manager script.',
      location: 'Scout Hall, Main Street',
      startDate: new Date().toISOString().split('T')[0],
      startTime: '18:00',
      endDate: new Date().toISOString().split('T')[0],
      endTime: '20:00',
      isAllDay: false
    };
    
    const result = createCalendarEvent(testEventData);
    console.log('✅ Test event creation result:', result);
    
    return result;
    
  } catch (error) {
    console.error('❌ Test event creation failed:', error);
    return {
      success: false,
      error: error.toString(),
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Test function - List upcoming events
 */
function testListEvents() {
  try {
    console.log('🧪 Testing event listing...');
    
    const result = listCalendarEvents();
    console.log('✅ Test event listing result:', result);
    
    return result;
    
  } catch (error) {
    console.error('❌ Test event listing failed:', error);
    return {
      success: false,
      error: error.toString(),
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Get calendar operation statistics from Google Sheets
 */
function getOperationStats() {
  try {
    const sheet = SpreadsheetApp.openById(CALENDAR_SHEET_ID).getSheetByName(CALENDAR_SHEET_NAME);
    
    if (!sheet) {
      return { total: 0, create: 0, update: 0, delete: 0, list: 0, get: 0, success: 0, failed: 0 };
    }
    
    const range = sheet.getDataRange();
    const values = range.getValues();
    
    if (values.length <= 1) {
      return { total: 0, create: 0, update: 0, delete: 0, list: 0, get: 0, success: 0, failed: 0 };
    }
    
    const headers = values[0];
    const rows = values.slice(1);
    const operationCol = headers.indexOf('operation');
    const statusCol = headers.indexOf('status');
    
    if (operationCol === -1 || statusCol === -1) {
      return { total: rows.length, create: 0, update: 0, delete: 0, list: 0, get: 0, success: 0, failed: 0 };
    }
    
    const stats = { total: rows.length, create: 0, update: 0, delete: 0, list: 0, get: 0, success: 0, failed: 0 };
    
    rows.forEach(row => {
      const operation = row[operationCol];
      const status = row[statusCol];
      
      // Count operations
      if (operation === 'CREATE') stats.create++;
      else if (operation === 'UPDATE') stats.update++;
      else if (operation === 'DELETE') stats.delete++;
      else if (operation === 'LIST') stats.list++;
      else if (operation === 'GET') stats.get++;
      
      // Count status
      if (status === 'SUCCESS') stats.success++;
      else if (status === 'FAILED') stats.failed++;
    });
    
    return stats;
    
  } catch (error) {
    console.error('Error getting operation stats:', error);
    return { error: error.toString() };
  }
}

/**
 * Clear all operation logs (use with caution!)
 */
function clearOperationLogs() {
  try {
    const sheet = SpreadsheetApp.openById(CALENDAR_SHEET_ID).getSheetByName(CALENDAR_SHEET_NAME);
    
    if (!sheet) {
      console.log('No CalendarOperations sheet found');
      return;
    }
    
    // Keep headers, clear data rows
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clear();
      console.log(`Cleared ${lastRow - 1} operation log records`);
    } else {
      console.log('No operation logs to clear');
    }
    
  } catch (error) {
    console.error('Error clearing operation logs:', error);
  }
}

