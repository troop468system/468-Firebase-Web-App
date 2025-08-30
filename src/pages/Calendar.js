import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  IconButton,
  CircularProgress,
  Alert,
  Tooltip,
  Popover,
  Tabs,
  Tab,
  Divider,
} from '@mui/material';
import {
  CalendarToday as CalendarIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  LocationOn as LocationIcon,
  Download as DownloadIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import PageTitle from '../components/PageTitle';
import googleCalendarService from '../services/googleCalendarService';

// Utility function to generate ICS file content
const generateICSContent = (events) => {
  const formatDate = (date) => {
    // Format date as YYYYMMDDTHHMMSSZ for ICS
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const formatDateOnly = (date) => {
    // Format date as YYYYMMDD for all-day events
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  };

  const escapeText = (text) => {
    return text.replace(/[\\,;]/g, '\\$&').replace(/\n/g, '\\n');
  };

  let icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Troop 468//Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH'
  ];

  events.forEach(event => {
    icsContent.push('BEGIN:VEVENT');
    icsContent.push(`UID:${event.id}@troop468.com`);
    icsContent.push(`SUMMARY:${escapeText(event.title)}`);
    
    if (event.description) {
      icsContent.push(`DESCRIPTION:${escapeText(event.description)}`);
    }
    
    if (event.location) {
      icsContent.push(`LOCATION:${escapeText(event.location)}`);
    }

    if (event.isAllDay) {
      // All-day event
      icsContent.push(`DTSTART;VALUE=DATE:${formatDateOnly(event.startDate)}`);
      // For all-day events, add 1 day to end date for ICS format
      const endDate = new Date(event.endDate);
      endDate.setDate(endDate.getDate() + 1);
      icsContent.push(`DTEND;VALUE=DATE:${formatDateOnly(endDate)}`);
    } else {
      // Timed event
      icsContent.push(`DTSTART:${formatDate(event.startDate)}`);
      icsContent.push(`DTEND:${formatDate(event.endDate)}`);
    }
    
    if (event.created) {
      icsContent.push(`CREATED:${formatDate(event.created)}`);
    }
    
    if (event.updated) {
      icsContent.push(`LAST-MODIFIED:${formatDate(event.updated)}`);
    }
    
    icsContent.push('STATUS:CONFIRMED');
    icsContent.push('END:VEVENT');
  });

  icsContent.push('END:VCALENDAR');
  return icsContent.join('\r\n');
};

const Calendar = () => {
  // State variables
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [instructionsAnchor, setInstructionsAnchor] = useState(null);
  const [hoveredEventIds, setHoveredEventIds] = useState([]);
  const [tabValue, setTabValue] = useState(0);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const today = new Date();

  // Handle calendar download
  const handleDownloadCalendar = () => {
    try {
      const icsContent = generateICSContent(events);
      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Troop468-Calendar-${new Date().getFullYear()}.ics`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('Download failed:', error);
      setError('Failed to download calendar');
    }
  };

  // Load events from Google Calendar
  useEffect(() => {
    const loadEvents = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Get events for the full year to ensure we have all data
        const startDate = new Date(currentYear, 0, 1);
        const endDate = new Date(currentYear, 11, 31, 23, 59, 59, 999);
        
        console.log(`Loading events for ${currentYear}...`);
        const calendarEvents = await googleCalendarService.getEventsForDateRange(startDate, endDate);
        
        setEvents(calendarEvents);
        console.log(`✅ Loaded ${calendarEvents.length} events for ${currentYear}`);
        
      } catch (error) {
        console.error('Failed to load events:', error);
        setError(`Failed to load calendar events: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, [currentYear]);

  // Get events for a specific date
  const getEventsForSelectedDate = (date) => {
    if (!events.length) return [];
    
    return events.filter(event => {
      if (event.isAllDay) {
        // For all-day events, check if the date falls within the event range
        const eventStart = new Date(event.startDate);
        const eventEnd = new Date(event.endDate);
        
        // Set times to start of day for comparison
        const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const startDate = new Date(eventStart.getFullYear(), eventStart.getMonth(), eventStart.getDate());
        const endDate = new Date(eventEnd.getFullYear(), eventEnd.getMonth(), eventEnd.getDate());
        
        return checkDate >= startDate && checkDate <= endDate;
      } else {
        // For timed events, check if the event starts on this date
        const eventDate = new Date(event.startDate.getFullYear(), event.startDate.getMonth(), event.startDate.getDate());
        const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        
        return eventDate.getTime() === checkDate.getTime();
      }
    });
  };

  // Check if a date has any events
  const hasEvents = (date) => {
    return getEventsForSelectedDate(date).length > 0;
  };

  // Whether selected event covers the given date (day precision)
  const isDateInSelectedEvent = (date) => {
    if (!selectedEvent) return false;
    const ev = events.find(e => e.id === selectedEvent);
    if (!ev) return false;
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const s = new Date(ev.startDate.getFullYear(), ev.startDate.getMonth(), ev.startDate.getDate());
    const e = new Date(ev.endDate.getFullYear(), ev.endDate.getMonth(), ev.endDate.getDate());
    return d >= s && d <= e;
  };

  // Whether hovered event covers the given date (day precision)
  const isDateInHoveredEvent = (date) => {
    if (!hoveredEventIds.length) return false;
    const hoveredEvent = events.find(e => e.id === hoveredEventIds[0]);
    if (!hoveredEvent) return false;
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const s = new Date(hoveredEvent.startDate.getFullYear(), hoveredEvent.startDate.getMonth(), hoveredEvent.startDate.getDate());
    const e = new Date(hoveredEvent.endDate.getFullYear(), hoveredEvent.endDate.getMonth(), hoveredEvent.endDate.getDate());
    return d >= s && d <= e;
  };

  // Get events for the current month view
  const getEventsForMonth = (year, month) => {
    return events.filter(event => {
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      
      // Check if event overlaps with this month
      const monthStart = new Date(year, month, 1);
      const monthEnd = new Date(year, month + 1, 0);
      
      return (eventStart <= monthEnd && eventEnd >= monthStart);
    });
  };

  // Navigation functions
  const navigateMonth = (direction) => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(newDate.getMonth() + direction);
      return newDate;
    });
  };

  // Generate calendar days for the current month
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDay.getDay(); // 0 = Sunday
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  // Format date range for multi-day events
  const formatDateRange = (startDate, endDate, isAllDay) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const formatDate = (date) => {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      }).toUpperCase();
    };
    
    if (isAllDay && start.toDateString() === end.toDateString()) {
      // Single day all-day event
      return formatDate(start);
    } else if (isAllDay) {
      // Multi-day all-day event
      return `${formatDate(start)}-${formatDate(end)}`;
    } else {
      // Timed event
      return start.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      }).toUpperCase();
    }
  };

  // Check if the current month is in the past
  const isCurrentMonthPast = () => {
    const now = new Date();
    return currentDate.getFullYear() < now.getFullYear() || 
           (currentDate.getFullYear() === now.getFullYear() && currentDate.getMonth() < now.getMonth());
  };

  // Generate Google Maps link from address
  const createGoogleMapsLink = (address) => {
    if (!address) return null;
    const encodedAddress = encodeURIComponent(address);
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
    console.log('🗺️ Generated Maps URL:', mapsUrl, 'for address:', address);
    return mapsUrl;
  };

  // Safely render HTML content
  const renderHtmlContent = (htmlString) => {
    if (!htmlString) return null;
    
    // Basic HTML sanitization - remove script tags and other dangerous elements
    const sanitized = htmlString
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
      .replace(/<object[^>]*>.*?<\/object>/gi, '')
      .replace(/<embed[^>]*>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
    
    return <Box 
      component="div" 
      dangerouslySetInnerHTML={{ __html: sanitized }}
      sx={{
        '& a': {
          color: 'inherit',
          textDecoration: 'underline',
          '&:hover': {
            textDecoration: 'none'
          }
        },
        '& br': {
          lineHeight: 1.2
        }
      }}
    />;
  };

  const calendarDays = generateCalendarDays();
  const monthEvents = getEventsForMonth(currentYear, currentMonth);
  const selectedDateEvents = getEventsForSelectedDate(selectedDate);

  // Event List View Component
  const EventListView = () => {
    const sortedEvents = [...events].sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    
    return (
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            All Events ({events.length})
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Download .ics file for Outlook/Mail app">
              <Button
                onClick={handleDownloadCalendar}
                color="primary"
                variant="outlined"
                size="small"
                startIcon={<DownloadIcon />}
              >
                Download Calendar
              </Button>
            </Tooltip>
            
            <Tooltip title="Import instructions">
              <IconButton 
                onClick={(e) => setInstructionsAnchor(e.currentTarget)}
                color="primary"
              >
                <InfoIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {events.length > 0 ? (
          <Box sx={{ space: 2 }}>
            {sortedEvents.map(event => (
              <Card 
                key={event.id} 
                variant="outlined" 
                sx={{ 
                  mb: 2,
                  borderColor: 'divider'
                }}
              >
                <CardContent sx={{ pb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    {event.title}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {/* Date information */}
                    <Typography variant="body2" color="text.secondary">
                      📅 {event.isAllDay ? 
                        (event.startDate.toDateString() === event.endDate.toDateString() ?
                          event.startDate.toLocaleDateString('en-US', { 
                            weekday: 'long',
                            month: 'long', 
                            day: 'numeric',
                            year: 'numeric'
                          }) :
                          `${event.startDate.toLocaleDateString('en-US', { 
                            weekday: 'short',
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                          })} - ${event.endDate.toLocaleDateString('en-US', { 
                            weekday: 'short',
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                          })}`
                        ) :
                        event.startDate.toLocaleDateString('en-US', { 
                          weekday: 'long',
                          month: 'long', 
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        })
                      }
                    </Typography>
                    
                    {!event.isAllDay && (
                      <Typography variant="body2" color="text.secondary">
                        ⏰ {event.startDate.toLocaleTimeString('en-US', { 
                          hour: 'numeric', 
                          minute: '2-digit',
                          hour12: true 
                        })} - {event.endDate.toLocaleTimeString('en-US', { 
                          hour: 'numeric', 
                          minute: '2-digit',
                          hour12: true 
                        })}
                      </Typography>
                    )}
                    
                    {event.location && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <LocationIcon fontSize="small" color="action" />
                        {createGoogleMapsLink(event.location) ? (
                          <a
                            href={createGoogleMapsLink(event.location)}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ 
                              color: '#1976d2',
                              textDecoration: 'underline',
                              fontSize: '0.875rem'
                            }}
                          >
                            {event.location}
                          </a>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            {event.location}
                          </Typography>
                        )}
                      </Box>
                    )}
                    
                    {event.description && (
                      <>
                        <Divider sx={{ my: 1 }} />
                        <Box sx={{ 
                          color: 'text.secondary',
                          fontSize: '0.875rem',
                          '& a': {
                            color: 'primary.main',
                            textDecoration: 'underline',
                            '&:hover': {
                              textDecoration: 'none'
                            }
                          }
                        }}>
                          {renderHtmlContent(event.description)}
                        </Box>
                      </>
                    )}
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        ) : (
          <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            No events found
          </Typography>
        )}
      </Box>
    );
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <PageTitle 
        icon={CalendarIcon} 
        title="Calendar" 
        description="View and manage troop events, meetings, and activities"
      />
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Calendar View" />
          <Tab label="Event List" />
        </Tabs>
      </Box>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && (
        <>
          {tabValue === 0 && (
            <Grid container spacing={3}>
        {/* Left side - Monthly Calendar */}
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <IconButton onClick={() => navigateMonth(-1)}>
                  <ChevronLeftIcon />
                </IconButton>
                
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {currentDate.toLocaleDateString('en-US', { 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                  {isCurrentMonthPast() && ' (Past)'}
                </Typography>
                
                <IconButton onClick={() => navigateMonth(1)}>
                  <ChevronRightIcon />
                </IconButton>
              </Box>

              {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              )}

              {!loading && (
                <>
                  {/* Calendar Grid */}
                  <Grid container spacing={0} sx={{ mb: 2 }}>
                      {/* Day headers */}
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <Grid item xs={12/7} key={day}>
                          <Box
                            sx={{
                              p: 1,
                              textAlign: 'center',
                              fontWeight: 600,
                              color: 'text.secondary',
                              fontSize: '0.875rem'
                            }}
                          >
                            {day}
                          </Box>
                        </Grid>
                      ))}
                      
                      {/* Calendar days */}
                      {calendarDays.map((date, index) => (
                        <Grid item xs={12/7} key={index}>
                          <Box
                            sx={{
                              p: 1,
                              textAlign: 'center',
                              minHeight: 42,
                              cursor: date ? 'pointer' : 'default',
                              position: 'relative',
                              backgroundColor: 'transparent',
                              color: date && date.toDateString() === today.toDateString() ? 'primary.main' : 'text.primary',
                              borderRadius: 1,
                              fontWeight: date && date.toDateString() === today.toDateString() ? 600 : 400
                            }}
                          >
                            {date && (() => {
                              // Check if this date has multi-day events
                              const multiDayEvents = events.filter(e => e.isAllDay &&
                                e.startDate && e.endDate && e.startDate.toDateString() !== e.endDate.toDateString() &&
                                new Date(date.getFullYear(), date.getMonth(), date.getDate()) >= new Date(e.startDate.getFullYear(), e.startDate.getMonth(), e.startDate.getDate()) &&
                                new Date(date.getFullYear(), date.getMonth(), date.getDate()) <= new Date(e.endDate.getFullYear(), e.endDate.getMonth(), e.endDate.getDate())
                              );

                              // Check if this date has single-day events (including timed events)
                              const singleDayEvents = getEventsForSelectedDate(date).filter(e => 
                                !e.isAllDay || e.startDate.toDateString() === e.endDate.toDateString()
                              );

                              const hasMultiDayEvents = multiDayEvents.length > 0;
                              const hasSingleDayEvents = singleDayEvents.length > 0;

                              return (
                                <>
                                  {/* Show pill for multi-day events OR circle for single-day events */}
                                  {hasMultiDayEvents ? (
                                    // Multi-day event pill
                                    multiDayEvents.slice(0,1).map(ev => {
                                      const isStart = date.toDateString() === ev.startDate.toDateString();
                                      const isEnd = date.toDateString() === ev.endDate.toDateString();
                                      const isSelected = selectedEvent === ev.id;
                                      const isHovered = hoveredEventIds.includes(ev.id);
                                      return (
                                        <Box
                                          key={ev.id}
                                          onClick={(e)=>{ e.stopPropagation(); setSelectedEvent(ev.id); }}
                                          onMouseEnter={() => setHoveredEventIds([ev.id])}
                                          onMouseLeave={() => setHoveredEventIds([])}
                                          sx={{
                                            position: 'absolute',
                                            top: '50%',
                                            left: isStart ? '20%' : '0%',
                                            right: isEnd ? '20%' : '0%',
                                            transform: 'translateY(-50%)',
                                            height: '60%',
                                            minHeight: 20,
                                            bgcolor: isSelected ? 'primary.main' : (isHovered ? 'primary.main' : 'primary.light'),
                                            borderRadius: isStart && isEnd ? '999px' : 
                                                         isStart ? '999px 0px 0px 999px' : 
                                                         isEnd ? '0px 999px 999px 0px' : '0px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: (isSelected || isHovered) ? 'white' : 'primary.contrastText',
                                            fontSize: '0.875rem',
                                            fontWeight: 500,
                                            transition: 'all 120ms ease',
                                            cursor: 'pointer',
                                            '&:hover': {
                                              bgcolor: isSelected ? 'primary.dark' : 'primary.main',
                                              color: 'white'
                                            }
                                          }}
                                        >
                                          {date.getDate()}
                                        </Box>
                                      );
                                    })
                                  ) : (
                                    // Single-day event circle or regular date
                                    <Box
                                      onClick={hasSingleDayEvents ? ((e) => {
                                        e.stopPropagation();
                                        // Find the single day event and select it
                                        const singleDayEvent = singleDayEvents[0];
                                        if (singleDayEvent) {
                                          setSelectedEvent(singleDayEvent.id);
                                        }
                                      }) : undefined}
                                      onMouseEnter={hasSingleDayEvents ? (() => {
                                        // Find the single day event and set it as hovered
                                        const singleDayEvent = singleDayEvents[0];
                                        if (singleDayEvent) {
                                          setHoveredEventIds([singleDayEvent.id]);
                                        }
                                      }) : undefined}
                                      onMouseLeave={hasSingleDayEvents ? (() => {
                                        setHoveredEventIds([]);
                                      }) : undefined}
                                      sx={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: 32,
                                        height: 32,
                                        borderRadius: '50%',
                                        backgroundColor: isDateInSelectedEvent(date) ? 'primary.main' : (hasSingleDayEvents ? 'primary.light' : 'transparent'),
                                        color: isDateInSelectedEvent(date) ? 'white' : 'inherit',
                                        border: isDateInHoveredEvent(date) ? '2px solid' : 'none',
                                        borderColor: 'primary.main',
                                        transition: 'all 120ms ease',
                                        cursor: hasSingleDayEvents ? 'pointer' : 'default',
                                        '&:hover': hasSingleDayEvents ? {
                                          backgroundColor: isDateInSelectedEvent(date) ? 'primary.dark' : 'primary.main',
                                          color: 'white'
                                        } : {}
                                      }}
                                      className="dateCircle"
                                    >
                                      {date.getDate()}
                                    </Box>
                                  )}
                                </>
                              );
                            })()}
                          </Box>
                        </Grid>
                      ))}
                  </Grid>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Right side - Event Details */}
        <Grid item xs={12} md={5}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Monthly Events
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Tooltip title="Download .ics file for Outlook/Mail app">
                    <Button
                      onClick={handleDownloadCalendar}
                      color="primary"
                      variant="outlined"
                      size="small"
                      startIcon={<DownloadIcon />}
                    >
                      Download Calendar
                    </Button>
                  </Tooltip>
                  
                  <Tooltip title="Import instructions">
                    <IconButton 
                      onClick={(e) => setInstructionsAnchor(e.currentTarget)}
                      color="primary"
                    >
                      <InfoIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>

              {monthEvents.length > 0 ? (
                <Box sx={{ space: 2, maxHeight: '60vh', overflowY: 'auto' }}>
                  {monthEvents
                    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
                    .map(event => (
                    <Card 
                      key={event.id} 
                      variant="outlined" 
                      onMouseEnter={() => setHoveredEventIds([event.id])}
                      onMouseLeave={() => setHoveredEventIds([])}
                      onClick={() => setSelectedEvent(event.id)}
                      sx={{ 
                        mb: 2,
                        cursor: 'pointer',
                        borderColor: hoveredEventIds.includes(event.id) ? 'primary.main' : 'divider',
                        backgroundColor: selectedEvent === event.id ? 'primary.main' : 'transparent',
                        color: selectedEvent === event.id ? 'white' : 'inherit',
                        transition: 'all 120ms ease',
                        '&:hover': {
                          borderColor: 'primary.main'
                        }
                      }}
                    >
                      <CardContent sx={{ pb: 2 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                          {event.title}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          {/* Always show date for monthly view */}
                          <Typography variant="body2" color={selectedEvent === event.id ? 'white' : 'text.secondary'}>
                            📅 {event.isAllDay ? 
                              (event.startDate.toDateString() === event.endDate.toDateString() ?
                                event.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) :
                                formatDateRange(event.startDate, event.endDate, true)
                              ) :
                              event.startDate.toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true
                              })
                            }
                          </Typography>
                          
                          {!event.isAllDay && (
                            <Typography variant="body2" color={selectedEvent === event.id ? 'white' : 'text.secondary'}>
                              ⏰ {event.startDate.toLocaleTimeString('en-US', { 
                                hour: 'numeric', 
                                minute: '2-digit',
                                hour12: true 
                              })} - {event.endDate.toLocaleTimeString('en-US', { 
                                hour: 'numeric', 
                                minute: '2-digit',
                                hour12: true 
                              })}
                            </Typography>
                          )}
                          
                          {event.location && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <LocationIcon fontSize="small" color={selectedEvent === event.id ? 'white' : 'action'} />
                              {createGoogleMapsLink(event.location) ? (
                                <a
                                  href={createGoogleMapsLink(event.location)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ 
                                    color: selectedEvent === event.id ? 'white' : '#1976d2',
                                    textDecoration: 'underline',
                                    fontSize: '0.875rem'
                                  }}
                                  onClick={(e) => {
                                    console.log('🔗 Map link clicked:', event.location);
                                    console.log('🔗 URL:', createGoogleMapsLink(event.location));
                                    e.preventDefault();
                                    e.stopPropagation();
                                    // Programmatically open the link in a new window
                                    window.open(createGoogleMapsLink(event.location), '_blank', 'noopener,noreferrer');
                                  }}
                                >
                                  {event.location}
                                </a>
                              ) : (
                                <Typography variant="body2" color={selectedEvent === event.id ? 'white' : 'text.secondary'}>
                                  {event.location}
                                </Typography>
                              )}
                            </Box>
                          )}
                          
                          {event.description && (
                            <Box sx={{ 
                              mt: 1,
                              color: selectedEvent === event.id ? 'white' : 'text.secondary',
                              fontSize: '0.875rem',
                              '& a': {
                                color: selectedEvent === event.id ? 'white' : 'primary.main',
                                textDecoration: 'underline',
                                '&:hover': {
                                  textDecoration: 'none'
                                }
                              }
                            }}>
                              {renderHtmlContent(event.description)}
                            </Box>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              ) : (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  No events this month
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
          )}

          {tabValue === 1 && (
            <EventListView />
          )}
        </>
      )}

      {/* Instructions Popover */}
      <Popover
        open={Boolean(instructionsAnchor)}
        anchorEl={instructionsAnchor}
        onClose={() => setInstructionsAnchor(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <Box sx={{ p: 3, maxWidth: 400 }}>
          <Typography variant="h6" gutterBottom>
            📱 Import to Your Calendar
          </Typography>
          
          <Typography variant="body2" paragraph>
            <strong>For Google Calendar:</strong>
          </Typography>
          <Typography variant="body2" paragraph sx={{ pl: 2 }}>
            1. Open Google Calendar<br/>
            2. Click the "+" next to "Other calendars"<br/>
            3. Select "Import"<br/>
            4. Choose the downloaded .ics file<br/>
            5. Select your calendar and click "Import"
          </Typography>
          
          <Typography variant="body2" paragraph>
            <strong>For Outlook/Apple Mail:</strong>
          </Typography>
          <Typography variant="body2" sx={{ pl: 2 }}>
            Double-click the downloaded .ics file and it will automatically open in your default calendar app.
          </Typography>
        </Box>
      </Popover>
    </Container>
  );
};

export default Calendar;
