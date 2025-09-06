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
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  CalendarToday as CalendarIcon,
  Schedule as ScheduleIcon,
  LocationOn as LocationIcon,
  Description as DescriptionIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon
} from '@mui/icons-material';

const DedicatedCalendarTest = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState('');
  const [error, setError] = useState('');
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  
  // Event form data
  const [eventData, setEventData] = useState({
    title: 'Test Troop Event - Dedicated Script',
    description: 'This event was created using the dedicated Calendar Manager Google Apps Script.',
    location: 'Scout Hall, Main Street',
    startDate: '',
    startTime: '18:00',
    endDate: '',
    endTime: '20:00',
    isAllDay: false
  });

  // Edit event data
  const [editEventData, setEditEventData] = useState({});

  // **IMPORTANT: Update this URL when you deploy the dedicated calendar script**
  const DEDICATED_CALENDAR_WEBHOOK_URL = 'YOUR_DEDICATED_CALENDAR_SCRIPT_URL_HERE';

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

  const handleEditInputChange = (field, value) => {
    setEditEventData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Generic function to call the dedicated calendar script
  const callCalendarScript = async (operation, payload = {}) => {
    if (DEDICATED_CALENDAR_WEBHOOK_URL === 'YOUR_DEDICATED_CALENDAR_SCRIPT_URL_HERE') {
      throw new Error('Please update the DEDICATED_CALENDAR_WEBHOOK_URL in the component with your actual Google Apps Script URL');
    }

    const requestPayload = {
      operation,
      ...payload
    };

    console.log(`📅 Calling dedicated calendar script - Operation: ${operation}`, requestPayload);

    const response = await fetch(DEDICATED_CALENDAR_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestPayload)
    });

    const responseText = await response.text();
    console.log('📥 Raw response:', responseText);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${responseText}`);
    }

    const result = JSON.parse(responseText);
    
    if (!result.success) {
      throw new Error(result.error || 'Unknown error from calendar script');
    }

    return result;
  };

  // Create calendar event
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

      const result = await callCalendarScript('create', {
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
      });

      setResponse(`✅ Calendar event created successfully!

Event Details:
• Title: ${result.eventDetails?.title || eventData.title}
• Event ID: ${result.eventId}
• Start: ${eventData.isAllDay ? eventData.startDate : `${eventData.startDate} ${eventData.startTime}`}
• End: ${eventData.isAllDay ? (eventData.endDate || eventData.startDate) : `${eventData.endDate || eventData.startDate} ${eventData.endTime}`}
• Location: ${eventData.location || 'None'}
• All Day: ${eventData.isAllDay ? 'Yes' : 'No'}

🔗 Event URL: ${result.eventUrl || 'N/A'}

✨ Created via dedicated Calendar Manager script!
📊 Operation logged to Google Sheets CalendarOperations tab.`);
      
      // Refresh events list if on manage tab
      if (activeTab === 1) {
        await loadEvents();
      }

    } catch (err) {
      console.error('Create event error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Update calendar event
  const updateEvent = async () => {
    try {
      setLoading(true);
      setError('');

      const result = await callCalendarScript('update', {
        eventId: selectedEvent.id,
        eventData: editEventData
      });

      setResponse(`✅ Calendar event updated successfully!
${result.message}
Event ID: ${result.eventId}`);

      setEditDialogOpen(false);
      setSelectedEvent(null);
      setEditEventData({});
      
      // Refresh events list
      await loadEvents();

    } catch (err) {
      console.error('Update event error:', err);
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

      const result = await callCalendarScript('delete', {
        eventId: eventId
      });

      setResponse(`✅ Calendar event deleted successfully!
Event ID: ${eventId}
${result.message}`);
      
      // Refresh events list
      await loadEvents();

    } catch (err) {
      console.error('Delete event error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load recent events
  const loadEvents = async (dateRange = {}) => {
    try {
      setLoading(true);
      setError('');

      const result = await callCalendarScript('list', {
        dateRange: dateRange
      });

      setEvents(result.events || []);
      setResponse(`✅ Loaded ${result.count || 0} events from Google Calendar
Date Range: ${result.dateRange?.startDate || 'N/A'} to ${result.dateRange?.endDate || 'N/A'}`);

    } catch (err) {
      console.error('Load events error:', err);
      setError(err.message);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  // Get specific event details
  const viewEventDetails = async (eventId) => {
    try {
      setLoading(true);
      setError('');

      const result = await callCalendarScript('get', {
        eventId: eventId
      });

      setSelectedEvent(result.event);
      setViewDialogOpen(true);

    } catch (err) {
      console.error('Get event error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Open edit dialog
  const openEditDialog = (event) => {
    setSelectedEvent(event);
    setEditEventData({
      title: event.title,
      description: event.description,
      location: event.location,
      startDate: event.startTime ? new Date(event.startTime).toISOString().split('T')[0] : '',
      startTime: event.startTime && !event.isAllDay ? new Date(event.startTime).toTimeString().slice(0, 5) : '18:00',
      endDate: event.endTime ? new Date(event.endTime).toISOString().split('T')[0] : '',
      endTime: event.endTime && !event.isAllDay ? new Date(event.endTime).toTimeString().slice(0, 5) : '20:00',
      isAllDay: event.isAllDay
    });
    setEditDialogOpen(true);
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
            🎯 Dedicated Calendar Manager
          </Typography>
        </Box>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Full CRUD operations for Google Calendar using a dedicated Google Apps Script. 
          Create, Read, Update, Delete events with comprehensive logging.
        </Typography>

        {/* Configuration Warning */}
        {DEDICATED_CALENDAR_WEBHOOK_URL === 'YOUR_DEDICATED_CALENDAR_SCRIPT_URL_HERE' && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="body2">
              ⚠️ <strong>Configuration Required:</strong> Please update the DEDICATED_CALENDAR_WEBHOOK_URL 
              in this component with your deployed Google Apps Script URL.
            </Typography>
          </Alert>
        )}

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

              {/* Date/Time Fields */}
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
                {loading ? 'Creating Event...' : '🚀 Create Calendar Event'}
              </Button>
            </Box>
          </Box>
        )}

        {/* Manage Events Tab */}
        {activeTab === 1 && (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6">
                Calendar Events Management
              </Typography>
              <Button
                onClick={() => loadEvents()}
                disabled={loading}
                variant="outlined"
                startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />}
              >
                {loading ? 'Loading...' : 'Refresh Events'}
              </Button>
            </Box>

            {events.length > 0 ? (
              <Box>
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
                          
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                            {event.isAllDay && (
                              <Chip label="All Day" size="small" color="info" />
                            )}
                            <Chip 
                              label={`ID: ${event.id.substring(0, 8)}...`} 
                              size="small" 
                              variant="outlined" 
                            />
                          </Box>
                        </Box>
                        
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <IconButton
                            onClick={() => viewEventDetails(event.id)}
                            disabled={loading}
                            color="info"
                            size="small"
                          >
                            <ViewIcon />
                          </IconButton>
                          <IconButton
                            onClick={() => openEditDialog(event)}
                            disabled={loading}
                            color="primary"
                            size="small"
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            onClick={() => deleteEvent(event.id)}
                            disabled={loading}
                            color="error"
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="text.secondary">
                  No events found. Click "Refresh Events" to load from Google Calendar.
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
            <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
              {error}
            </Typography>
          </Alert>
        )}

        <Divider sx={{ my: 3 }} />

        {/* Information Box */}
        <Box sx={{ p: 2, backgroundColor: 'success.light', borderRadius: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            🎯 Dedicated Calendar Manager Features
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • <strong>Full CRUD Operations:</strong> Create, Read, Update, Delete calendar events<br/>
            • <strong>Comprehensive Logging:</strong> All operations logged to CalendarOperations sheet<br/>
            • <strong>Focused & Clean:</strong> Dedicated script for calendar operations only<br/>
            • <strong>Error Handling:</strong> Robust error handling and user feedback<br/>
            • <strong>Real Calendar Integration:</strong> Direct Google Calendar API access
          </Typography>
        </Box>
      </CardContent>

      {/* Edit Event Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Calendar Event</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Event Title"
                value={editEventData.title || ''}
                onChange={(e) => handleEditInputChange('title', e.target.value)}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={editEventData.description || ''}
                onChange={(e) => handleEditInputChange('description', e.target.value)}
                variant="outlined"
                multiline
                rows={3}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Location"
                value={editEventData.location || ''}
                onChange={(e) => handleEditInputChange('location', e.target.value)}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={editEventData.isAllDay || false}
                    onChange={(e) => handleEditInputChange('isAllDay', e.target.checked)}
                  />
                }
                label="All Day Event"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="date"
                label="Start Date"
                value={editEventData.startDate || ''}
                onChange={(e) => handleEditInputChange('startDate', e.target.value)}
                variant="outlined"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            {!editEventData.isAllDay && (
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="time"
                  label="Start Time"
                  value={editEventData.startTime || '18:00'}
                  onChange={(e) => handleEditInputChange('startTime', e.target.value)}
                  variant="outlined"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            )}
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="date"
                label="End Date"
                value={editEventData.endDate || ''}
                onChange={(e) => handleEditInputChange('endDate', e.target.value)}
                variant="outlined"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            {!editEventData.isAllDay && (
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="time"
                  label="End Time"
                  value={editEventData.endTime || '20:00'}
                  onChange={(e) => handleEditInputChange('endTime', e.target.value)}
                  variant="outlined"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={updateEvent} variant="contained" disabled={loading}>
            {loading ? 'Updating...' : 'Update Event'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Event Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Event Details</DialogTitle>
        <DialogContent>
          {selectedEvent && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="h6" gutterBottom>{selectedEvent.title}</Typography>
              <Typography variant="body1" paragraph>{selectedEvent.description}</Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                📅 {formatDateTime(selectedEvent.startTime, selectedEvent.isAllDay)}
                {selectedEvent.endTime && ` - ${formatDateTime(selectedEvent.endTime, selectedEvent.isAllDay)}`}
              </Typography>
              {selectedEvent.location && (
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  📍 {selectedEvent.location}
                </Typography>
              )}
              <Typography variant="body2" color="text.secondary" gutterBottom>
                🆔 Event ID: {selectedEvent.id}
              </Typography>
              {selectedEvent.created && (
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  🕐 Created: {new Date(selectedEvent.created).toLocaleString()}
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default DedicatedCalendarTest;

