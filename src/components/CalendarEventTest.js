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
  Divider
} from '@mui/material';
import {
  CalendarToday as CalendarIcon,
  Schedule as ScheduleIcon,
  LocationOn as LocationIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';

const CalendarEventTest = () => {
  const [eventData, setEventData] = useState({
    summary: 'Test Troop Event',
    description: 'This is a test event created from the Troop Manager application to verify calendar integration.',
    location: 'Scout Hall, Main Street',
    startDate: '',
    startTime: '18:00',
    endDate: '',
    endTime: '20:00',
    isAllDay: false
  });
  
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState('');
  const [error, setError] = useState('');

  // Set default dates to today and tomorrow
  React.useEffect(() => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
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

  const createEvent = async () => {
    try {
      setLoading(true);
      setError('');
      setResponse('');

      // Validate required fields
      if (!eventData.summary.trim()) {
        throw new Error('Event title is required');
      }
      if (!eventData.startDate) {
        throw new Error('Start date is required');
      }
      if (!eventData.endDate) {
        throw new Error('End date is required');
      }

      // Prepare event object for Google Calendar API
      let eventObject;
      
      if (eventData.isAllDay) {
        // All-day event
        eventObject = {
          summary: eventData.summary,
          description: eventData.description,
          location: eventData.location,
          start: {
            date: eventData.startDate,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
          },
          end: {
            date: eventData.endDate,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
          }
        };
      } else {
        // Timed event
        const startDateTime = new Date(`${eventData.startDate}T${eventData.startTime}`);
        const endDateTime = new Date(`${eventData.endDate}T${eventData.endTime}`);
        
        eventObject = {
          summary: eventData.summary,
          description: eventData.description,
          location: eventData.location,
          start: {
            dateTime: startDateTime.toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
          },
          end: {
            dateTime: endDateTime.toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
          }
        };
      }

      console.log('Creating calendar event:', eventObject);

      // Get API configuration
      const apiKey = process.env.REACT_APP_GOOGLE_API_KEY;
      const calendarId = process.env.REACT_APP_GOOGLE_CALENDAR_ID || 'primary';
      
      if (!apiKey) {
        throw new Error('Google API Key not configured');
      }

      // Note: This will likely fail with API key only authentication
      // because creating events typically requires OAuth2 with write permissions
      const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?key=${apiKey}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventObject)
      });

      const responseText = await response.text();
      
      if (response.ok) {
        const result = JSON.parse(responseText);
        setResponse(`✅ Event created successfully!
Event ID: ${result.id}
Event Link: ${result.htmlLink || 'N/A'}
Start: ${eventData.isAllDay ? eventData.startDate : `${eventData.startDate} ${eventData.startTime}`}
End: ${eventData.isAllDay ? eventData.endDate : `${eventData.endDate} ${eventData.endTime}`}`);
      } else {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.error?.message || errorMessage;
        } catch {
          errorMessage = responseText || errorMessage;
        }
        
        // Provide helpful error messages for common issues
        if (response.status === 401) {
          errorMessage = 'Authentication failed. API key authentication may not have write permissions to this calendar.';
        } else if (response.status === 403) {
          errorMessage = 'Access forbidden. This API key may not have permission to create events in this calendar.';
        } else if (response.status === 404) {
          errorMessage = 'Calendar not found. Please check the REACT_APP_GOOGLE_CALENDAR_ID environment variable.';
        }
        
        throw new Error(errorMessage);
      }

    } catch (err) {
      console.error('Calendar event creation error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card sx={{ mb: 4 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <CalendarIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            📅 Calendar Event Creation Test
          </Typography>
        </Box>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Test creating a new event in your Google Calendar. Note: This requires write permissions which may not be available with API key authentication.
        </Typography>

        <Grid container spacing={2}>
          {/* Event Title */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Event Title"
              value={eventData.summary}
              onChange={(e) => handleInputChange('summary', e.target.value)}
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
            sx={{ mr: 2 }}
          >
            {loading ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Creating Event...
              </>
            ) : (
              '🚀 Create Test Calendar Event'
            )}
          </Button>
        </Box>

        {/* Response Display */}
        {response && (
          <Alert severity="success" sx={{ mt: 2 }}>
            <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
              {response}
            </Typography>
          </Alert>
        )}

        {/* Error Display */}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
              Failed to create calendar event:
            </Typography>
            <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
              {error}
            </Typography>
          </Alert>
        )}

        {/* Information Box */}
        <Box sx={{ mt: 3, p: 2, backgroundColor: 'info.light', borderRadius: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            ℹ️ Authentication Requirements
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Creating calendar events typically requires OAuth2 authentication with calendar write permissions. 
            API key authentication usually only provides read access to public calendars. If this test fails with 
            a 401 or 403 error, you'll need to implement OAuth2 authentication for write operations.
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Configuration Status */}
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            🔧 Current Configuration
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Google API Key:</strong> {process.env.REACT_APP_GOOGLE_API_KEY ? '✅ Configured' : '❌ Not configured'}<br/>
            <strong>Calendar ID:</strong> {process.env.REACT_APP_GOOGLE_CALENDAR_ID || 'primary (default)'}<br/>
            <strong>Timezone:</strong> {Intl.DateTimeFormat().resolvedOptions().timeZone}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default CalendarEventTest;

