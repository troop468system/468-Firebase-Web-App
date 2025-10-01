import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Alert,
  CircularProgress,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  CalendarToday as CalendarIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';

const SimpleCalendarTest = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [modifyDialogOpen, setModifyDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Form data for create
  const [createData, setCreateData] = useState({
    title: 'Test Troop Meeting',
    description: 'Test event created from Settings page',
    location: 'Scout Hall',
    startDate: '',
    startTime: '18:00',
    endDate: '',
    endTime: '20:00',
    isAllDay: false
  });
  
  // Form data for modify
  const [modifyData, setModifyData] = useState({
    eventId: '',
    title: 'Modified Event Title',
    description: 'Updated description',
    location: 'Updated Location'
  });
  
  // Form data for delete
  const [deleteData, setDeleteData] = useState({
    eventId: ''
  });

  // Using the same Google Apps Script as email test since it handles both operations
  const CALENDAR_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbx9PRWvVJCEIqxivmz1PpT0yfjaM-LU5LqEfKWt-hBqwQIYYkaZdX2GiSYxynT2QLtK/exec';

  // Set default dates
  React.useEffect(() => {
    const today = new Date();
    const formatDate = (date) => date.toISOString().split('T')[0];
    
    setCreateData(prev => ({
      ...prev,
      startDate: formatDate(today),
      endDate: formatDate(today)
    }));
  }, []);

  // Generic function to call calendar script using type-based routing
  const callCalendarScript = async (type, payload = {}) => {
    const requestPayload = { type, ...payload };

    console.log(`📅 Sending ${type} request:`, requestPayload);
    console.log('📅 Payload stringified:', JSON.stringify(requestPayload, null, 2));

    const response = await fetch(CALENDAR_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' }, // Using text/plain to avoid CORS issues
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
  const handleCreateEvent = async () => {
    try {
      setLoading(true);
      setError('');
      setResult('');

      if (!createData.title.trim()) {
        throw new Error('Event title is required');
      }

      const result = await callCalendarScript('Calendar-Create', {
        eventData: createData
      });

      setResult(`✅ Calendar event created successfully!

Event ID: ${result.eventId}
Title: ${createData.title}
Date: ${createData.startDate} ${createData.isAllDay ? '(All Day)' : createData.startTime}
Location: ${createData.location || 'None'}

The event has been added to your Google Calendar and logged to Google Sheets.`);

      setCreateDialogOpen(false);

    } catch (err) {
      setError(`Create failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Modify calendar event
  const handleModifyEvent = async () => {
    try {
      setLoading(true);
      setError('');
      setResult('');

      if (!modifyData.eventId.trim()) {
        throw new Error('Event ID is required');
      }

      const result = await callCalendarScript('Calendar-Update', {
        eventId: modifyData.eventId,
        eventData: {
          title: modifyData.title,
          description: modifyData.description,
          location: modifyData.location
        }
      });

      setResult(`✅ Calendar event modified successfully!

Event ID: ${modifyData.eventId}
Updated Title: ${modifyData.title}
Updated Location: ${modifyData.location}

${result.message}`);

      setModifyDialogOpen(false);

    } catch (err) {
      setError(`Modify failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Delete calendar event
  const handleDeleteEvent = async () => {
    try {
      setLoading(true);
      setError('');
      setResult('');

      if (!deleteData.eventId.trim()) {
        throw new Error('Event ID is required');
      }

      const result = await callCalendarScript('Calendar-Delete', {
        eventId: deleteData.eventId
      });

      setResult(`✅ Calendar event deleted successfully!

Event ID: ${deleteData.eventId}
${result.message}

The event has been removed from your Google Calendar.`);

      setDeleteDialogOpen(false);

    } catch (err) {
      setError(`Delete failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // List events to find event IDs
  const listEvents = async () => {
    try {
      setLoading(true);
      setError('');
      setResult('');

      const result = await callCalendarScript('Calendar-List', {
        dateRange: {
          startDate: '2025-01-01',
          endDate: '2025-12-31'
        }
      });

      let eventsList = 'No events found';
      if (result.events && result.events.length > 0) {
        eventsList = result.events.map(event => 
          `📅 ${event.title}
Event ID: ${event.id}
Date: ${new Date(event.startTime).toLocaleDateString()}
Location: ${event.location || 'No location'}
---`
        ).join('\n');
      }

      setResult(`✅ Found ${result.count || 0} calendar events:

${eventsList}

💡 Copy the Event ID from above to use in Modify or Delete operations.`);

    } catch (err) {
      setError(`List events failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card sx={{
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(15px)',
      WebkitBackdropFilter: 'blur(15px)',
      border: '1px solid rgba(76, 175, 80, 0.3)',
      borderRadius: '15px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
    }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <CalendarIcon sx={{ 
            mr: 1, 
            color: '#4caf50',
            filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))'
          }} />
          <Typography variant="h6" sx={{ 
            fontWeight: 600,
            color: 'rgba(255, 255, 255, 0.95)',
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.4)'
          }}>
            📅 Calendar Event Management
          </Typography>
        </Box>
        
        <Typography variant="body2" sx={{ 
          mb: 3,
          color: 'rgba(255, 255, 255, 0.8)',
          textShadow: '0 1px 1px rgba(0, 0, 0, 0.3)'
        }}>
          Create, modify, or delete calendar events using Google Apps Script integration.
        </Typography>


        {/* Four Buttons */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <Button
              onClick={() => setCreateDialogOpen(true)}
              variant="contained"
              color="success"
              fullWidth
              startIcon={<AddIcon />}
              disabled={loading}
            >
              Create Event
            </Button>
          </Grid>
          <Grid item xs={12} md={3}>
            <Button
              onClick={() => setModifyDialogOpen(true)}
              variant="contained"
              color="primary"
              fullWidth
              startIcon={<EditIcon />}
              disabled={loading}
            >
              Modify Event
            </Button>
          </Grid>
          <Grid item xs={12} md={3}>
            <Button
              onClick={() => setDeleteDialogOpen(true)}
              variant="contained"
              color="error"
              fullWidth
              startIcon={<DeleteIcon />}
              disabled={loading}
            >
              Delete Event
            </Button>
          </Grid>
          <Grid item xs={12} md={3}>
            <Button
              onClick={listEvents}
              variant="contained"
              color="info"
              fullWidth
              startIcon={<RefreshIcon />}
              disabled={loading}
            >
              List Events
            </Button>
          </Grid>
        </Grid>

        {/* Success Display */}
        {result && (
          <Alert severity="success" icon={<SuccessIcon />} sx={{ mb: 2 }}>
            <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
              {result}
            </Typography>
          </Alert>
        )}

        {/* Error Display */}
        {error && (
          <Alert severity="error" icon={<ErrorIcon />}>
            <Typography variant="body2">
              {error}
            </Typography>
          </Alert>
        )}

      </CardContent>

      {/* Create Event Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Calendar Event</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Event Title"
                value={createData.title}
                onChange={(e) => setCreateData(prev => ({ ...prev, title: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={createData.description}
                onChange={(e) => setCreateData(prev => ({ ...prev, description: e.target.value }))}
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Location"
                value={createData.location}
                onChange={(e) => setCreateData(prev => ({ ...prev, location: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={createData.isAllDay}
                    onChange={(e) => setCreateData(prev => ({ ...prev, isAllDay: e.target.checked }))}
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
                value={createData.startDate}
                onChange={(e) => setCreateData(prev => ({ ...prev, startDate: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            {!createData.isAllDay && (
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="time"
                  label="Start Time"
                  value={createData.startTime}
                  onChange={(e) => setCreateData(prev => ({ ...prev, startTime: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            )}
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="date"
                label="End Date"
                value={createData.endDate}
                onChange={(e) => setCreateData(prev => ({ ...prev, endDate: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            {!createData.isAllDay && (
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="time"
                  label="End Time"
                  value={createData.endTime}
                  onChange={(e) => setCreateData(prev => ({ ...prev, endTime: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateEvent} 
            variant="contained" 
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : <AddIcon />}
          >
            {loading ? 'Creating...' : 'Create Event'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modify Event Dialog */}
      <Dialog open={modifyDialogOpen} onClose={() => setModifyDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Modify Calendar Event</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Event ID"
                value={modifyData.eventId}
                onChange={(e) => setModifyData(prev => ({ ...prev, eventId: e.target.value }))}
                placeholder="Enter the Event ID to modify"
                helperText="You can get Event IDs from your Google Calendar or previous operations"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="New Title"
                value={modifyData.title}
                onChange={(e) => setModifyData(prev => ({ ...prev, title: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="New Description"
                value={modifyData.description}
                onChange={(e) => setModifyData(prev => ({ ...prev, description: e.target.value }))}
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="New Location"
                value={modifyData.location}
                onChange={(e) => setModifyData(prev => ({ ...prev, location: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModifyDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleModifyEvent} 
            variant="contained" 
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : <EditIcon />}
          >
            {loading ? 'Modifying...' : 'Modify Event'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Event Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Delete Calendar Event</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Event ID"
            value={deleteData.eventId}
            onChange={(e) => setDeleteData(prev => ({ ...prev, eventId: e.target.value }))}
            placeholder="Enter the Event ID to delete"
            helperText="⚠️ This action cannot be undone"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleDeleteEvent} 
            variant="contained" 
            color="error"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : <DeleteIcon />}
          >
            {loading ? 'Deleting...' : 'Delete Event'}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default SimpleCalendarTest;
