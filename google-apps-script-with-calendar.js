/**
 * Google Apps Script - Email Queue & Calendar Manager for Troop 468
 * This script receives email and calendar requests from React app
 * 
 * Features:
 * - Email Queue Management (existing)
 * - Calendar Event Creation/Deletion (new)
 * 
 * Your Google Sheet Structure:
 * - EmailQueue tab: timestamp | type | to | name | role | subject | htmlBody | status | meta | sentAt
 * - CalendarQueue tab: timestamp | action | title | description | location | startDate | endDate | isAllDay | eventId | status | meta
 */

// Configuration
const EMAIL_QUEUE_SHEET_ID = '1GX3U7UH28IcnNH2KQbVG-SVMBcGTmMa01QMEhGTicUM';
const EMAIL_QUEUE_SHEET_NAME = 'EmailQueue';
const CALENDAR_QUEUE_SHEET_NAME = 'CalendarQueue';

// Calendar Configuration
const CALENDAR_ID = 'primary'; // Use 'primary' for main calendar or specify a calendar ID

/**
 * Handle HTTP POST requests from React app
 */
function doPost(e) {
  try {
    console.log('📨 Received request from React app');
    
    // Parse request data
    const requestData = JSON.parse(e.postData.contents);
    console.log('📦 Request data:', requestData);
    
    let processedCount = 0;
    let errors = [];
    let response = {};
    
    // Determine request type and route accordingly
    if (requestData.requestType === 'calendar') {
      // Handle calendar requests
      console.log('📅 Processing calendar request');
      response = await handleCalendarRequest(requestData);
      
    } else if (requestData.rows && Array.isArray(requestData.rows)) {
      // Handle email requests (existing functionality)
      console.log(`📬 Processing ${requestData.rows.length} email requests`);
      
      try {
        processedCount = saveEmailsToSheet(requestData.rows);
        console.log(`✅ Saved ${processedCount} email records to Google Sheets`);
        
        response = {
          success: true,
          processed: processedCount,
          errors: errors,
          timestamp: new Date().toISOString(),
          message: `Successfully processed ${processedCount} email records`
        };
      } catch (error) {
        console.error('❌ Error saving emails:', error);
        errors.push(`Failed to save emails to sheet: ${error.toString()}`);
        response = {
          success: false,
          error: error.toString(),
          timestamp: new Date().toISOString()
        };
      }
    } else {
      throw new Error('Invalid request format. Expected calendar request or email rows array.');
    }
    
    console.log('✅ Request completed:', response);
    
    // Return JSON response
    return ContentService
      .createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('❌ Error in doPost:', error);
    
    const errorResponse = {
      success: false,
      error: error.toString(),
      timestamp: new Date().toISOString()
    };
    
    return ContentService
      .createTextOutput(JSON.stringify(errorResponse))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handle calendar-related requests
 */
async function handleCalendarRequest(requestData) {
  try {
    const { action, eventData } = requestData;
    
    switch (action) {
      case 'create':
        return await createCalendarEvent(eventData);
      case 'delete':
        return await deleteCalendarEvent(eventData.eventId);
      case 'list':
        return await listRecentEvents();
      default:
        throw new Error(`Unknown calendar action: ${action}`);
    }
    
  } catch (error) {
    console.error('❌ Error handling calendar request:', error);
    return {
      success: false,
      error: error.toString(),
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Create a calendar event
 */
async function createCalendarEvent(eventData) {
  try {
    console.log('📅 Creating calendar event:', eventData);
    
    // Validate required fields
    if (!eventData.title) {
      throw new Error('Event title is required');
    }
    if (!eventData.startDate) {
      throw new Error('Start date is required');
    }
    
    // Prepare event object for Google Calendar
    let calendarEvent = {
      summary: eventData.title,
      description: eventData.description || '',
      location: eventData.location || ''
    };
    
    // Handle all-day vs timed events
    if (eventData.isAllDay) {
      // All-day event
      calendarEvent.start = {
        date: eventData.startDate
      };
      calendarEvent.end = {
        date: eventData.endDate || eventData.startDate
      };
    } else {
      // Timed event
      const startDateTime = new Date(`${eventData.startDate}T${eventData.startTime || '12:00'}`);
      const endDateTime = new Date(`${eventData.endDate || eventData.startDate}T${eventData.endTime || '13:00'}`);
      
      calendarEvent.start = {
        dateTime: startDateTime.toISOString()
      };
      calendarEvent.end = {
        dateTime: endDateTime.toISOString()
      };
    }
    
    // Create event using Google Calendar API
    const calendar = CalendarApp.getCalendarById(CALENDAR_ID) || CalendarApp.getDefaultCalendar();
    
    let createdEvent;
    if (eventData.isAllDay) {
      const startDate = new Date(eventData.startDate);
      const endDate = new Date(eventData.endDate || eventData.startDate);
      // For all-day events, add 1 day to end date as Calendar API expects
      endDate.setDate(endDate.getDate() + 1);
      
      createdEvent = calendar.createAllDayEvent(
        calendarEvent.summary,
        startDate,
        endDate,
        {
          description: calendarEvent.description,
          location: calendarEvent.location
        }
      );
    } else {
      const startDateTime = new Date(`${eventData.startDate}T${eventData.startTime || '12:00'}`);
      const endDateTime = new Date(`${eventData.endDate || eventData.startDate}T${eventData.endTime || '13:00'}`);
      
      createdEvent = calendar.createEvent(
        calendarEvent.summary,
        startDateTime,
        endDateTime,
        {
          description: calendarEvent.description,
          location: calendarEvent.location
        }
      );
    }
    
    // Log event creation to Google Sheets
    const logData = {
      action: 'CREATE',
      title: eventData.title,
      description: eventData.description || '',
      location: eventData.location || '',
      startDate: eventData.startDate,
      endDate: eventData.endDate || eventData.startDate,
      startTime: eventData.startTime || '',
      endTime: eventData.endTime || '',
      isAllDay: eventData.isAllDay || false,
      eventId: createdEvent.getId(),
      status: 'SUCCESS',
      meta: {
        source: 'ReactApp',
        createdAt: new Date().toISOString()
      }
    };
    
    logCalendarAction(logData);
    
    console.log('✅ Calendar event created:', createdEvent.getId());
    
    return {
      success: true,
      eventId: createdEvent.getId(),
      eventUrl: `https://calendar.google.com/calendar/event?eid=${createdEvent.getId()}`,
      message: 'Calendar event created successfully',
      eventDetails: {
        title: createdEvent.getTitle(),
        startTime: createdEvent.getStartTime(),
        endTime: createdEvent.getEndTime(),
        location: createdEvent.getLocation(),
        description: createdEvent.getDescription()
      },
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ Error creating calendar event:', error);
    
    // Log failed attempt
    const logData = {
      action: 'CREATE',
      title: eventData.title || 'Unknown',
      description: eventData.description || '',
      location: eventData.location || '',
      startDate: eventData.startDate || '',
      endDate: eventData.endDate || '',
      isAllDay: eventData.isAllDay || false,
      eventId: '',
      status: 'FAILED',
      meta: {
        source: 'ReactApp',
        error: error.toString(),
        attemptedAt: new Date().toISOString()
      }
    };
    
    logCalendarAction(logData);
    
    throw error;
  }
}

/**
 * Delete a calendar event
 */
async function deleteCalendarEvent(eventId) {
  try {
    console.log('🗑️ Deleting calendar event:', eventId);
    
    if (!eventId) {
      throw new Error('Event ID is required for deletion');
    }
    
    const calendar = CalendarApp.getCalendarById(CALENDAR_ID) || CalendarApp.getDefaultCalendar();
    const event = calendar.getEventById(eventId);
    
    if (!event) {
      throw new Error('Event not found');
    }
    
    const eventTitle = event.getTitle();
    event.deleteEvent();
    
    // Log event deletion
    const logData = {
      action: 'DELETE',
      title: eventTitle,
      eventId: eventId,
      status: 'SUCCESS',
      meta: {
        source: 'ReactApp',
        deletedAt: new Date().toISOString()
      }
    };
    
    logCalendarAction(logData);
    
    console.log('✅ Calendar event deleted:', eventId);
    
    return {
      success: true,
      eventId: eventId,
      message: `Calendar event "${eventTitle}" deleted successfully`,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ Error deleting calendar event:', error);
    
    // Log failed attempt
    const logData = {
      action: 'DELETE',
      eventId: eventId || '',
      status: 'FAILED',
      meta: {
        source: 'ReactApp',
        error: error.toString(),
        attemptedAt: new Date().toISOString()
      }
    };
    
    logCalendarAction(logData);
    
    throw error;
  }
}

/**
 * List recent calendar events
 */
async function listRecentEvents() {
  try {
    console.log('📋 Fetching recent calendar events...');
    
    const calendar = CalendarApp.getCalendarById(CALENDAR_ID) || CalendarApp.getDefaultCalendar();
    const now = new Date();
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const events = calendar.getEvents(now, oneWeekFromNow);
    
    const eventList = events.map(event => ({
      id: event.getId(),
      title: event.getTitle(),
      startTime: event.getStartTime(),
      endTime: event.getEndTime(),
      location: event.getLocation(),
      description: event.getDescription(),
      isAllDay: event.isAllDayEvent()
    }));
    
    console.log(`✅ Found ${eventList.length} upcoming events`);
    
    return {
      success: true,
      events: eventList,
      count: eventList.length,
      message: `Found ${eventList.length} upcoming events`,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ Error listing events:', error);
    throw error;
  }
}

/**
 * Log calendar actions to Google Sheets
 */
function logCalendarAction(logData) {
  try {
    console.log('📊 Logging calendar action to Google Sheets...');
    
    // Open the spreadsheet
    const spreadsheet = SpreadsheetApp.openById(EMAIL_QUEUE_SHEET_ID);
    let sheet = spreadsheet.getSheetByName(CALENDAR_QUEUE_SHEET_NAME);
    
    // Create CalendarQueue sheet if it doesn't exist
    if (!sheet) {
      console.log('📋 Creating CalendarQueue sheet...');
      sheet = spreadsheet.insertSheet(CALENDAR_QUEUE_SHEET_NAME);
      
      // Add headers
      const headers = ['timestamp', 'action', 'title', 'description', 'location', 'startDate', 'endDate', 'startTime', 'endTime', 'isAllDay', 'eventId', 'status', 'meta'];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      
      // Format header row
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#E8F4FD');
      
      console.log('✅ CalendarQueue sheet created with headers');
    }
    
    // Prepare data row
    const timestamp = new Date().toISOString();
    const sheetRow = [
      timestamp,                                    // A: timestamp
      logData.action || '',                         // B: action (CREATE/DELETE)
      logData.title || '',                          // C: title
      logData.description || '',                    // D: description
      logData.location || '',                       // E: location
      logData.startDate || '',                      // F: startDate
      logData.endDate || '',                        // G: endDate
      logData.startTime || '',                      // H: startTime
      logData.endTime || '',                        // I: endTime
      logData.isAllDay || false,                    // J: isAllDay
      logData.eventId || '',                        // K: eventId
      logData.status || 'UNKNOWN',                  // L: status
      JSON.stringify({                              // M: meta
        source: 'ReactApp',
        processedAt: timestamp,
        ...logData.meta
      })
    ];
    
    // Add row to sheet
    const startRow = sheet.getLastRow() + 1;
    const range = sheet.getRange(startRow, 1, 1, sheetRow.length);
    range.setValues([sheetRow]);
    
    console.log(`📊 Added calendar log at row ${startRow}`);
    
    // Auto-resize columns for better readability
    sheet.autoResizeColumns(1, sheetRow.length);
    
  } catch (error) {
    console.error('❌ Error logging calendar action:', error);
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
 * Save email records to Google Sheets (existing functionality)
 */
function saveEmailsToSheet(emailRows) {
  try {
    console.log(`📊 Saving ${emailRows.length} emails to Google Sheets...`);
    
    // Open the spreadsheet
    const spreadsheet = SpreadsheetApp.openById(EMAIL_QUEUE_SHEET_ID);
    let sheet = spreadsheet.getSheetByName(EMAIL_QUEUE_SHEET_NAME);
    
    // Create EmailQueue sheet if it doesn't exist
    if (!sheet) {
      console.log('📋 Creating EmailQueue sheet...');
      sheet = spreadsheet.insertSheet(EMAIL_QUEUE_SHEET_NAME);
      
      // Add headers
      const headers = ['timestamp', 'type', 'to', 'name', 'role', 'subject', 'htmlBody', 'status', 'meta', 'sentAt'];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      
      // Format header row
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#E8F0FE');
      
      console.log('✅ EmailQueue sheet created with headers');
    }
    
    // Prepare data rows
    const timestamp = new Date().toISOString();
    const sheetRows = emailRows.map(emailData => [
      timestamp,                                    // A: timestamp
      emailData.type || 'EMAIL',                    // B: type
      emailData.to || '',                           // C: to
      emailData.name || '',                         // D: name
      emailData.role || '',                         // E: role
      emailData.subject || '',                      // F: subject
      emailData.htmlBody || emailData.body || '',   // G: htmlBody
      'QUEUED',                                     // H: status
      JSON.stringify({                              // I: meta
        source: 'ReactApp',
        queuedAt: timestamp,
        userAgent: 'TroopManager',
        ...emailData.meta
      }),
      ''                                            // J: sentAt (empty for queued)
    ]);
    
    // Add rows to sheet
    if (sheetRows.length > 0) {
      const startRow = sheet.getLastRow() + 1;
      const range = sheet.getRange(startRow, 1, sheetRows.length, sheetRows[0].length);
      range.setValues(sheetRows);
      
      console.log(`📊 Added ${sheetRows.length} email rows starting at row ${startRow}`);
      
      // Auto-resize columns for better readability
      sheet.autoResizeColumns(1, sheetRows[0].length);
    }
    
    return sheetRows.length;
    
  } catch (error) {
    console.error('❌ Error saving emails to Google Sheets:', error);
    throw error;
  }
}

/**
 * Manual test function - run this to test the calendar system
 */
function testCalendarIntegration() {
  try {
    console.log('🧪 Testing calendar integration...');
    
    // Test event data
    const testEventData = {
      title: 'Test Troop Meeting',
      description: 'This is a test event created by the Google Apps Script calendar integration.',
      location: 'Scout Hall, Main Street',
      startDate: '2024-01-15',
      startTime: '18:00',
      endDate: '2024-01-15',
      endTime: '20:00',
      isAllDay: false
    };
    
    // Test creating an event
    console.log('📅 Testing event creation...');
    const createResult = createCalendarEvent(testEventData);
    console.log('✅ Event creation result:', createResult);
    
    // Test listing events
    console.log('📋 Testing event listing...');
    const listResult = listRecentEvents();
    console.log('✅ Event listing result:', listResult);
    
    console.log('🎉 Calendar integration test completed!');
    
    return {
      success: true,
      createResult,
      listResult,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ Calendar integration test failed:', error);
    return {
      success: false,
      error: error.toString(),
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Get calendar queue statistics
 */
function getCalendarStats() {
  try {
    const sheet = SpreadsheetApp.openById(EMAIL_QUEUE_SHEET_ID).getSheetByName(CALENDAR_QUEUE_SHEET_NAME);
    
    if (!sheet) {
      return { total: 0, created: 0, deleted: 0, failed: 0 };
    }
    
    const range = sheet.getDataRange();
    const values = range.getValues();
    
    if (values.length <= 1) {
      return { total: 0, created: 0, deleted: 0, failed: 0 };
    }
    
    const headers = values[0];
    const rows = values.slice(1);
    const actionCol = headers.indexOf('action');
    const statusCol = headers.indexOf('status');
    
    if (actionCol === -1 || statusCol === -1) {
      return { total: rows.length, created: 0, deleted: 0, failed: 0 };
    }
    
    const stats = { total: rows.length, created: 0, deleted: 0, failed: 0 };
    
    rows.forEach(row => {
      const action = row[actionCol];
      const status = row[statusCol];
      
      if (status === 'SUCCESS') {
        if (action === 'CREATE') stats.created++;
        else if (action === 'DELETE') stats.deleted++;
      } else if (status === 'FAILED') {
        stats.failed++;
      }
    });
    
    return stats;
    
  } catch (error) {
    console.error('Error getting calendar stats:', error);
    return { error: error.toString() };
  }
}

