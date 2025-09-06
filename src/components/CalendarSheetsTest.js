import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  FormControlLabel,
  Switch,
  Grid,
  CircularProgress,
  Divider,
  Tabs,
  Tab,
  List,
  IconButton,
  Chip
} from '@mui/material';
import {
  CalendarToday as CalendarIcon,
  Schedule as ScheduleIcon,
  LocationOn as LocationIcon,
  Description as DescriptionIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon
} from '@mui/icons-material';

const CalendarSheetsTest = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState('');
  const [error, setError] = useState('');
  const [events, setEvents] = useState([]);
  
  // Event form data
  const [eventData, setEventData] = useState({
    title: 'Test Troop Event via Google Sheets',
    description: 'This is a test event created through Google Apps Script to verify calendar integration.',
    location: 'Scout Hall, Main Street',
    startDate: '',
    startTime: '18:00',
    endDate: '',
    endTime: '20:00',
    isAllDay: false
  });

  // Your Google Apps Script webhook URL
  const WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbx9PRWvVJCEIqxivmz1PpT0yfjaM-LU5LqEfKWt-hBqwQIYYkaZdX2GiSYxynT2QLtK/exec';

  // Set default dates to today
  React.useEffect(() => {
    const today = new Date();
    const formatDate = (date) => {
      return date.toISOString().split('T')[0];
    };
    
    setEventData(prev => ({
      ...prev,
      startDate: formatDate(today),
      endDate: formatDate(today)
    }));
  }, []);

  const handleInputChange = (field, value) => {
    setEventData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Create calendar event via Google Apps Script
  const createEvent = async () => {
    try {
      setLoading(true);
      setError('');
      setResponse('');

      // Validate required fields
      if (!eventData.title.trim()) {
        throw new Error('Event title is required');
      }
      if (!eventData.startDate) {
        throw new Error('Start date is required');
      }

      console.log('📅 Creating calendar event via Google Apps Script...');

      // Prepare calendar request payload
      const payload = {
        requestType: 'calendar',
        action: 'create',
        eventData: {
          title: eventData.title,
          description: eventData.description,
          location: eventData.location,
          startDate: eventData.startDate,
          endDate: eventData.endDate || eventData.startDate,
          startTime: eventData.isAllDay ? '' : eventData.startTime,
          endTime: eventData.isAllDay ? '' : eventData.endTime,
          isAllDay: eventData.isAllDay
        }
      };

      console.log('📤 Sending payload:', payload);

      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const responseText = await response.text();
      console.log('📥 Raw response:', responseText);

      if (response.ok) {
        const result = JSON.parse(responseText);
        
        if (result.success) {
          setResponse(`✅ Calendar event created successfully via Google Apps Script!

Event Details:
• Title: ${result.eventDetails?.title || eventData.title}
• Event ID: ${result.eventId}
• Start: ${eventData.isAllDay ? eventData.startDate : `${eventData.startDate} ${eventData.startTime}`}
• End: ${eventData.isAllDay ? (eventData.endDate || eventData.startDate) : `${eventData.endDate || eventData.startDate} ${eventData.endTime}`}
• Location: ${eventData.location || 'None'}
• All Day: ${eventData.isAllDay ? 'Yes' : 'No'}

✨ This event was created using Google Apps Script's Calendar API!
📊 Event details have been logged to your Google Sheets.`);
          
          // Refresh events list if on that tab
          if (activeTab === 1) {
            await loadEvents();
          }
        } else {
          throw new Error(result.error || 'Unknown error from Google Apps Script');
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${responseText}`);
      }

    } catch (err) {
      console.error('Calendar event creation error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete calendar event
  const deleteEvent = async (eventId) => {
    try {
      setLoading(true);
      setError('');

      console.log('🗑️ Deleting calendar event via Google Apps Script...');

      const payload = {
        requestType: 'calendar',
        action: 'delete',
        eventData: {
          eventId: eventId
        }
      };

      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const responseText = await response.text();
      
      if (response.ok) {
        const result = JSON.parse(responseText);
        
        if (result.success) {
          setResponse(`✅ Calendar event deleted successfully!
Event ID: ${eventId}
${result.message}`);
          
          // Refresh events list
          await loadEvents();
        } else {
          throw new Error(result.error || 'Failed to delete event');
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${responseText}`);
      }

    } catch (err) {
      console.error('Delete event error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load recent events
  const loadEvents = async () => {
    try {
      setLoading(true);
      setError('');

      console.log('📋 Loading recent events via Google Apps Script...');

      const payload = {
        requestType: 'calendar',
        action: 'list'
      };

      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const responseText = await response.text();
      
      if (response.ok) {
        const result = JSON.parse(responseText);
        
        if (result.success) {
          setEvents(result.events || []);
          setResponse(`✅ Loaded ${result.count || 0} upcoming events from Google Calendar`);
        } else {
          throw new Error(result.error || 'Failed to load events');
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${responseText}`);
      }

    } catch (err) {
      console.error('Load events error:', err);
      setError(err.message);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  // Format date/time for display
  const formatDateTime = (dateTime, isAllDay) => {
    if (isAllDay) {
      return new Date(dateTime).toLocaleDateString();
    }
    return new Date(dateTime).toLocaleString();
  };

  return (
    <Card sx={{ mb: 4 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <CalendarIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            📅 Calendar Management via Google Sheets
          </Typography>
        </Box>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Create and manage calendar events using Google Apps Script with full Calendar API access.
          No OAuth2 required! Events are logged to your Google Sheets.
        </Typography>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
            <Tab label="Create Event" icon={<AddIcon />} />
            <Tab label="Manage Events" icon={<CalendarIcon />} />
          </Tabs>
        </Box>

        {/* Create Event Tab */}
        {activeTab === 0 && (
          <Box>
            <Grid container spacing={2}>
              {/* Event Title */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Event Title"
                  value={eventData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  variant="outlined"
                  InputProps={{
                    startAdornment: <ScheduleIcon sx={{ mr: 1, color: 'action.active' }} />
                  }}
                />
              </Grid>

              {/* Event Description */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  value={eventData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  variant="outlined"
                  multiline
                  rows={3}
                  InputProps={{
                    startAdornment: <DescriptionIcon sx={{ mr: 1, color: 'action.active', alignSelf: 'flex-start', mt: 1 }} />
                  }}
                />
              </Grid>

              {/* Location */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Location"
                  value={eventData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  variant="outlined"
                  InputProps={{
                    startAdornment: <LocationIcon sx={{ mr: 1, color: 'action.active' }} />
                  }}
                />
              </Grid>

              {/* All Day Toggle */}
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={eventData.isAllDay}
                      onChange={(e) => handleInputChange('isAllDay', e.target.checked)}
                    />
                  }
                  label="All Day Event"
                />
              </Grid>

              {/* Start Date/Time */}
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Start Date"
                  value={eventData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  variant="outlined"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              {!eventData.isAllDay && (
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    type="time"
                    label="Start Time"
                    value={eventData.startTime}
                    onChange={(e) => handleInputChange('startTime', e.target.value)}
                    variant="outlined"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              )}

              {/* End Date/Time */}
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="End Date"
                  value={eventData.endDate}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                  variant="outlined"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              {!eventData.isAllDay && (
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    type="time"
                    label="End Time"
                    value={eventData.endTime}
                    onChange={(e) => handleInputChange('endTime', e.target.value)}
                    variant="outlined"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              )}
            </Grid>

            <Box sx={{ mt: 3 }}>
              <Button
                onClick={createEvent}
                disabled={loading}
                variant="contained"
                size="large"
                startIcon={loading ? <CircularProgress size={20} /> : <AddIcon />}
              >
                {loading ? 'Creating Event...' : '🚀 Create Calendar Event via Google Apps Script'}
              </Button>
            </Box>
          </Box>
        )}

        {/* Manage Events Tab */}
        {activeTab === 1 && (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6">
                Upcoming Events (Next 7 Days)
              </Typography>
              <Button
                onClick={loadEvents}
                disabled={loading}
                variant="outlined"
                startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />}
              >
                {loading ? 'Loading...' : 'Refresh Events'}
              </Button>
            </Box>

            {events.length > 0 ? (
              <List>
                {events.map((event, index) => (
                  <Card key={event.id || index} variant="outlined" sx={{ mb: 2 }}>
                    <CardContent sx={{ pb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                            {event.title}
                          </Typography>
                          
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            📅 {formatDateTime(event.startTime, event.isAllDay)}
                            {!event.isAllDay && event.endTime && 
                              ` - ${formatDateTime(event.endTime, event.isAllDay)}`
                            }
                          </Typography>
                          
                          {event.location && (
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              📍 {event.location}
                            </Typography>
                          )}
                          
                          {event.description && (
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              📝 {event.description}
                            </Typography>
                          )}
                          
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {event.isAllDay && (
                              <Chip label="All Day" size="small" color="info" />
                            )}
                            <Chip 
                              label={`ID: ${event.id.substring(0, 12)}...`} 
                              size="small" 
                              variant="outlined" 
                            />
                          </Box>
                        </Box>
                        
                        <IconButton
                          onClick={() => deleteEvent(event.id)}
                          disabled={loading}
                          color="error"
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </List>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="text.secondary">
                  No upcoming events found. Click "Refresh Events" to load from Google Calendar.
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {/* Response Display */}
        {response && (
          <Alert severity="success" sx={{ mt: 2 }} icon={<SuccessIcon />}>
            <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
              {response}
            </Typography>
          </Alert>
        )}

        {/* Error Display */}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }} icon={<ErrorIcon />}>
            <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
              Operation failed:
            </Typography>
            <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
              {error}
            </Typography>
          </Alert>
        )}

        <Divider sx={{ my: 3 }} />

        {/* Information Box */}
        <Box sx={{ p: 2, backgroundColor: 'success.light', borderRadius: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            ✅ How This Works (Google Apps Script Advantage)
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • <strong>Full Calendar API Access:</strong> Google Apps Script runs in Google's environment with full permissions<br/>
            • <strong>No OAuth2 Required:</strong> Scripts have automatic access to your Google services<br/>
            • <strong>Automatic Logging:</strong> All calendar operations are logged to your Google Sheets<br/>
            • <strong>Real Calendar Integration:</strong> Events are created in your actual Google Calendar<br/>
            • <strong>Reliable & Secure:</strong> Uses Google's own infrastructure
          </Typography>
        </Box>

        <Box sx={{ mt: 2, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            📊 Google Sheets Integration
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Calendar operations are automatically logged to a "CalendarQueue" tab in your Google Sheets with details including:
            timestamps, actions, event details, success/failure status, and metadata for audit purposes.
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default CalendarSheetsTest;
