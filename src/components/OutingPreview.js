import React, { useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Snackbar,
  Alert,
  Card,
  CardContent,
  Grid
} from '@mui/material';
import {
  GetApp as DownloadIcon,
  Assignment as AssignmentIcon,
  Description as DescriptionIcon,
  Backpack as BackpackIcon,
  DirectionsCar as DirectionsCarIcon,
  LocalHospital as LocalHospitalIcon,
  NotificationImportant as NotificationImportantIcon,
  ContactPhone as ContactPhoneIcon,
  MenuBook as MenuBookIcon,
  LocationOn as LocationOnIcon,
  Schedule as ScheduleIconSvg
} from '@mui/icons-material';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Weather Forecast Component
const WeatherForecast = ({ startDate, endDate, location }) => {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  React.useEffect(() => {
    if (!startDate || !endDate) {
      console.log('WeatherForecast: Missing dates', { startDate, endDate });
      return;
    }

    const generateWeatherData = () => {
      setLoading(true);
      setError(null);
      
      try {
        // For demo purposes, we'll create mock weather data based on the screenshot
        // In a real implementation, you would call a weather API like OpenWeatherMap
        
        // Handle different date formats more robustly
        let start, end;
        
        // If already Date objects, use them directly
        if (startDate instanceof Date && !isNaN(startDate.getTime())) {
          start = new Date(startDate);
        } else if (startDate) {
          // Try to parse as timestamp, ISO string, or other formats
          if (typeof startDate === 'object' && startDate.toDate) {
            // Firestore timestamp
            start = startDate.toDate();
          } else if (typeof startDate === 'number' || typeof startDate === 'string') {
            start = new Date(startDate);
          } else {
            start = new Date(startDate);
          }
        }
        
        if (endDate instanceof Date && !isNaN(endDate.getTime())) {
          end = new Date(endDate);
        } else if (endDate) {
          // Try to parse as timestamp, ISO string, or other formats
          if (typeof endDate === 'object' && endDate.toDate) {
            // Firestore timestamp
            end = endDate.toDate();
          } else if (typeof endDate === 'number' || typeof endDate === 'string') {
            end = new Date(endDate);
          } else {
            end = new Date(endDate);
          }
        }
        
        // Validate dates
        if (!start || !end || isNaN(start.getTime()) || isNaN(end.getTime())) {
          console.error('WeatherForecast: Invalid dates after parsing', { 
            startDate, endDate, 
            startType: typeof startDate, endType: typeof endDate,
            parsedStart: start, parsedEnd: end 
          });
          setError('Invalid date format - unable to parse dates');
          setLoading(false);
          return;
        }
        
        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
        console.log('WeatherForecast: Generating weather for', days, 'days from', start, 'to', end);
        
        // Mock weather data with detailed hourly information
        const mockWeather = [];
        for (let i = 0; i < days; i++) {
          const date = new Date(start);
          date.setDate(start.getDate() + i);
          
          // Generate hourly weather data for each day
          const dayData = {
            date: date,
            dayName: date.toLocaleDateString('en-US', { weekday: 'long' }),
            sunrise: '6:46AM',
            sunset: '7:26PM',
            hourlyData: []
          };
          
          // Generate hourly data from 1:00 PM to 11:00 PM (10 hours)
          const startHour = 13; // 1:00 PM
          for (let hour = 0; hour < 10; hour++) {
            const currentHour = startHour + hour;
            const displayHour = currentHour > 12 ? currentHour - 12 : currentHour;
            const ampm = currentHour >= 12 ? 'pm' : 'am';
            
            // Generate realistic temperature progression with some extreme values for testing
            const baseTemp = 74;
            const tempVariation = Math.sin((hour / 10) * Math.PI) * 6; // Temperature curve
            let temp = Math.round(baseTemp + tempVariation + (Math.random() * 4 - 2));
            
            // Occasionally generate extreme temperatures for color testing
            if (Math.random() < 0.1) { // 10% chance
              temp = Math.random() < 0.5 ? Math.round(45 + Math.random() * 4) : Math.round(92 + Math.random() * 8); // Cold (45-49) or hot (92-100)
            }
            
            const feelsLike = temp + Math.round(Math.random() * 2 - 1); // Usually close to actual temp
            
            // Weather conditions based on time of day
            let condition, conditionText, icon;
            if (hour < 3) {
              condition = Math.random() > 0.5 ? 'mostly-cloudy' : 'partly-cloudy';
              conditionText = condition === 'mostly-cloudy' ? 'Mostly Cloudy' : 'Partly Cloudy';
              icon = condition === 'mostly-cloudy' ? '🌤️' : '⛅';
            } else if (hour < 6) {
              condition = 'partly-cloudy';
              conditionText = 'Partly Cloudy';
              icon = '⛅';
            } else if (hour < 8) {
              condition = Math.random() > 0.5 ? 'mostly-clear' : 'partly-cloudy';
              conditionText = condition === 'mostly-clear' ? 'Mostly Clear' : 'Partly Cloudy';
              icon = condition === 'mostly-clear' ? '🌙' : '⛅';
            } else {
              condition = 'partly-cloudy';
              conditionText = 'Partly Cloudy';
              icon = '🌙';
            }
            
            dayData.hourlyData.push({
              time: `${displayHour}:00 ${ampm}`,
              condition: conditionText,
              icon: icon,
              temp: temp,
              feelsLike: feelsLike
            });
          }
          
          mockWeather.push(dayData);
        }
        
        setWeatherData(mockWeather);
        console.log('WeatherForecast: Successfully generated', mockWeather.length, 'days of weather data');
      } catch (err) {
        console.error('WeatherForecast: Error generating weather data', err);
        setError('Failed to fetch weather data: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    generateWeatherData();
  }, [startDate, endDate, location]);

  const getWeatherIcon = (condition) => {
    switch (condition) {
      case 'sunny': return '☀️';
      case 'partly-cloudy': return '⛅';
      case 'cloudy': return '☁️';
      case 'rainy': return '🌧️';
      default: return '☀️';
    }
  };

  const getTemperatureColor = (temp) => {
    if (temp > 90) {
      return '#d32f2f'; // Red for hot temperatures
    } else if (temp < 50) {
      return '#1976d2'; // Blue for cold temperatures
    }
    return '#2c3e50'; // Default dark color
  };

  if (loading) {
    return (
      <Box className="weather-section" sx={{ 
        px: 4,
        py: 6,
        backgroundColor: '#f0f8ff',
        textAlign: 'center'
      }}>
        <Typography variant="h6" sx={{ 
          fontWeight: 600, 
          mb: 3, 
          textAlign: 'left', 
          color: '#2c3e50',
          fontSize: '1.2rem',
          display: 'flex', 
          alignItems: 'center', 
          gap: 1 
        }}>
          <svg 
            width="1.2rem" 
            height="1.2rem" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="#2c3e50" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M6 16.326A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 0 9H6Z"/>
            <path d="m13 10-2 2 2 2"/>
            <path d="M10 6V4"/>
            <path d="M14 6V4"/>
            <path d="M6 10H4"/>
            <path d="M18 10h-2"/>
          </svg>
          Weather Forecast
          {location && (
            <Typography 
              component="span" 
              sx={{ 
                ml: 1, 
                fontSize: '0.8rem', 
                fontWeight: 400, 
                color: '#666' 
              }}
            >
              ({location})
            </Typography>
          )}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mt: 4 }}>
          <CircularProgress size={24} />
          <Typography variant="body1" sx={{ color: '#666' }}>Loading weather forecast...</Typography>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box className="weather-section" sx={{ 
        px: 4,
        py: 6,
        backgroundColor: '#f0f8ff'
      }}>
        <Typography variant="h6" sx={{ 
          fontWeight: 600, 
          mb: 3, 
          textAlign: 'left', 
          color: '#2c3e50',
          fontSize: '1.2rem',
          display: 'flex', 
          alignItems: 'center', 
          gap: 1 
        }}>
          <svg 
            width="1.2rem" 
            height="1.2rem" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="#2c3e50" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M6 16.326A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 0 9H6Z"/>
            <path d="m13 10-2 2 2 2"/>
            <path d="M10 6V4"/>
            <path d="M14 6V4"/>
            <path d="M6 10H4"/>
            <path d="M18 10h-2"/>
          </svg>
          Weather Forecast
          {location && (
            <Typography 
              component="span" 
              sx={{ 
                ml: 1, 
                fontSize: '0.8rem', 
                fontWeight: 400, 
                color: '#666' 
              }}
            >
              ({location})
            </Typography>
          )}
        </Typography>
        <Typography 
          variant="body1"
          sx={{ 
            lineHeight: 1.8, 
            textAlign: 'left',
            color: '#d32f2f',
            fontSize: '1.0rem',
            padding: '0 24px',
            margin: '0 auto'
          }}
        >
          Error loading weather forecast: {error}
        </Typography>
      </Box>
    );
  }

  if (!weatherData) {
    return (
      <Box className="weather-section" sx={{ 
        px: 4,
        py: 6,
        backgroundColor: '#f0f8ff'
      }}>
        <Typography variant="h6" sx={{ 
          fontWeight: 600, 
          mb: 3, 
          textAlign: 'left', 
          color: '#2c3e50',
          fontSize: '1.2rem',
          display: 'flex', 
          alignItems: 'center', 
          gap: 1 
        }}>
          <svg 
            width="1.2rem" 
            height="1.2rem" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="#2c3e50" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M6 16.326A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 0 9H6Z"/>
            <path d="m13 10-2 2 2 2"/>
            <path d="M10 6V4"/>
            <path d="M14 6V4"/>
            <path d="M6 10H4"/>
            <path d="M18 10h-2"/>
          </svg>
          Weather Forecast
          {location && (
            <Typography 
              component="span" 
              sx={{ 
                ml: 1, 
                fontSize: '0.8rem', 
                fontWeight: 400, 
                color: '#666' 
              }}
            >
              ({location})
            </Typography>
          )}
        </Typography>
        <Typography 
          variant="body1"
          sx={{ 
            lineHeight: 1.8, 
            textAlign: 'left',
            color: '#666',
            fontSize: '1.0rem',
            padding: '0 24px',
            margin: '0 auto',
            fontStyle: 'italic'
          }}
        >
          Loading weather forecast data...
        </Typography>
      </Box>
    );
  }
  
  // Group days into rows of 3
  const groupedDays = [];
  for (let i = 0; i < weatherData.length; i += 3) {
    groupedDays.push(weatherData.slice(i, i + 3));
  }

  return (
    <Box className="weather-section" sx={{ 
      px: 4,
      py: 6,
      backgroundColor: '#f0f8ff'
    }}>
      <Typography variant="h6" sx={{ 
        fontWeight: 600, 
        mb: 3, 
        textAlign: 'left', 
        color: '#2c3e50',
        fontSize: '1.2rem',
        display: 'flex', 
        alignItems: 'center', 
        gap: 1 
      }}>
        {/* Weather Icon SVG - Cloud with Sun */}
        <svg 
          width="1.2rem" 
          height="1.2rem" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="#2c3e50" 
          strokeWidth="1.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <path d="M6 16.326A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 0 9H6Z"/>
          <path d="m13 10-2 2 2 2"/>
          <path d="M10 6V4"/>
          <path d="M14 6V4"/>
          <path d="M6 10H4"/>
          <path d="M18 10h-2"/>
        </svg>
        Weather Forecast
        {location && (
          <Typography 
            component="span" 
            sx={{ 
              ml: 1, 
              fontSize: '0.8rem', 
              fontWeight: 400, 
              color: '#666' 
            }}
          >
            ({location})
          </Typography>
        )}
      </Typography>
      
      {/* Weather Data in Rows of 3 Days */}
      {groupedDays.map((dayGroup, groupIndex) => (
        <Card key={groupIndex} sx={{ 
          mb: 3, 
          borderRadius: 3,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          border: '1px solid rgba(0,0,0,0.05)',
          backgroundColor: '#ffffff',
          color: '#000000'
        }}>
          <CardContent sx={{ p: 0 }}>
            <Grid container>
              {dayGroup.map((day, dayIndex) => (
                <Grid 
                  item 
                  xs={12} 
                  md={dayGroup.length === 1 ? 12 : dayGroup.length === 2 ? 6 : 4} 
                  key={dayIndex}
                  sx={{ 
                    borderRight: dayIndex < dayGroup.length - 1 ? '1px solid #e0e0e0' : 'none',
                    minHeight: '100%'
                  }}
                >
                  {/* Day Header */}
                  <Box sx={{ 
                    p: 2, 
                    borderBottom: '1px solid #f0f0f0',
                    backgroundColor: '#fafafa',
                    textAlign: 'center'
                  }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#2c3e50', fontSize: '1rem' }}>
                      {day.dayName}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#666', fontSize: '0.75rem' }}>
                      {day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 2V4M12 20V22M4 12H2M6.31412 6.31412L4.8999 4.8999M17.6859 6.31412L19.1001 4.8999M6.31412 17.69L4.8999 19.1042M17.6859 17.69L19.1001 19.1042M22 12H20M16 12C16 14.2091 14.2091 16 12 16C9.79086 16 8 14.2091 8 12C8 9.79086 9.79086 8 12 8C14.2091 8 16 9.79086 16 12Z" 
                                stroke="#ff9800" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <Typography variant="caption" sx={{ color: '#ff9800', fontSize: '0.7rem', fontWeight: 500 }}>
                          {day.sunrise}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" 
                                stroke="#ff5722" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <Typography variant="caption" sx={{ color: '#ff5722', fontSize: '0.7rem', fontWeight: 500 }}>
                          {day.sunset}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  {/* Compact Hourly Weather List */}
                  <Box sx={{ 
                    p: 2,
                    backgroundColor: '#ffffff',
                    color: '#000000'
                  }}>
                    {/* Table Header */}
                    <Grid container sx={{ 
                      mb: 1, 
                      pb: 0.5, 
                      borderBottom: '1px solid #e0e0e0'
                    }}>
                      <Grid item xs={3}>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: '#2c3e50', fontSize: '0.7rem' }}>
                          Time
                        </Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: '#2c3e50', fontSize: '0.7rem' }}>
                          Conditions
                        </Typography>
                      </Grid>
                      <Grid item xs={2.5}>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: '#2c3e50', fontSize: '0.7rem' }}>
                          Temp
                        </Typography>
                      </Grid>
                      <Grid item xs={2.5}>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: '#2c3e50', fontSize: '0.7rem' }}>
                          Feel
                        </Typography>
                      </Grid>
                    </Grid>

                    {/* Compact Hourly Rows */}
                    {day.hourlyData.map((hour, hourIndex) => (
                      <Grid 
                        container 
                        key={hourIndex}
                        alignItems="center"
                        sx={{ 
                          py: 0.5,
                          borderBottom: hourIndex < day.hourlyData.length - 1 ? '1px solid #f5f5f5' : 'none',
                          backgroundColor: '#ffffff',
                          color: '#000000',
                          '&:hover': {
                            backgroundColor: '#f8f9fa'
                          }
                        }}
                      >
                        <Grid item xs={3}>
                          <Typography variant="caption" sx={{ color: '#333333 !important', fontSize: '0.7rem' }}>
                            {hour.time}
                          </Typography>
                        </Grid>
                        <Grid item xs={4}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Box sx={{ fontSize: '0.8rem' }}>{hour.icon}</Box>
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                color: '#2c3e50 !important', 
                                fontSize: '0.65rem',
                                lineHeight: 1.2,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {hour.condition.replace('Mostly ', 'M.').replace('Partly ', 'P.')}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={2.5}>
                          <Typography variant="caption" sx={{ 
                            fontWeight: 600, 
                            color: getTemperatureColor(hour.temp), 
                            fontSize: '0.7rem' 
                          }}>
                            {hour.temp}°
                          </Typography>
                        </Grid>
                        <Grid item xs={2.5}>
                          <Typography variant="caption" sx={{ 
                            fontWeight: 600, 
                            color: getTemperatureColor(hour.feelsLike), 
                            fontSize: '0.7rem' 
                          }}>
                            {hour.feelsLike}°
                          </Typography>
                        </Grid>
                      </Grid>
                    ))}
                  </Box>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};

const OutingPreview = ({ 
  outingData, 
  showExportButton = false, 
  isLiveView = false,
  onLoadOuting = null 
}) => {
  const { eventId } = useParams();
  const previewRef = useRef();
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Load outing data for live view
  React.useEffect(() => {
    if (isLiveView && eventId && onLoadOuting) {
      onLoadOuting(eventId);
    }
  }, [isLiveView, eventId, onLoadOuting]);

  // Get cover background image based on selection
  const getCoverBackgroundImage = () => {
    const imageMap = {
      biking: 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?ixlib=rb-4.0.3&auto=format&fit=crop&w=2560&q=80',
      snow: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?ixlib=rb-4.0.3&auto=format&fit=crop&w=2560&q=80',
      hike: 'https://images.unsplash.com/photo-1533873984035-25970ab07461?ixlib=rb-4.0.3&auto=format&fit=crop&w=2560&q=80',
      mountain: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2560&q=80',
      rafting: 'https://plus.unsplash.com/premium_photo-1661891887710-0528c1d76b92?ixlib=rb-4.0.3&auto=format&fit=crop&w=2560&q=80',
      sea: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?ixlib=rb-4.0.3&auto=format&fit=crop&w=2560&q=80',
      camp: 'https://images.unsplash.com/photo-1504851149312-7a075b496cc7?ixlib=rb-4.0.3&auto=format&fit=crop&w=2560&q=80',
      backpack: 'https://images.unsplash.com/photo-1551632811-561732d1e306?ixlib=rb-4.0.3&auto=format&fit=crop&w=2560&q=80',
      forest: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2560&q=80',
      canyon: 'https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?ixlib=rb-4.0.3&auto=format&fit=crop&w=2560&q=80',
      tropical: 'https://images.unsplash.com/photo-1509233725247-49e657c54213?ixlib=rb-4.0.3&auto=format&fit=crop&w=2560&q=80',
      bridge: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?ixlib=rb-4.0.3&auto=format&fit=crop&w=2560&q=80',
      beach: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2560&q=80',
      trail: 'https://images.unsplash.com/photo-1445308394109-4ec2920981b1?ixlib=rb-4.0.3&auto=format&fit=crop&w=2560&q=80',
      city: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-4.0.3&auto=format&fit=crop&w=2560&q=80',
      sport: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?ixlib=rb-4.0.3&auto=format&fit=crop&w=2560&q=80'
    };
    return imageMap[outingData.coverImage] || imageMap.biking;
  };

  // Group activities by day
  const groupActivitiesByDay = () => {
    const grouped = {};
    
    if (!outingData.scheduleDays || outingData.scheduleDays.length === 0) {
      return grouped;
    }

    outingData.scheduleDays.forEach((day) => {
      const dayTitle = day.date 
        ? new Date(day.date).toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric' 
          })
        : day.title || 'Day';
      
      if (!grouped[dayTitle]) {
        grouped[dayTitle] = [];
      }

      if (day.activities && day.activities.length > 0) {
        day.activities.forEach((activity) => {
          const leadDisplay = typeof activity.lead === 'object' && activity.lead !== null
            ? activity.lead.name || activity.lead.displayName || ''
            : activity.lead || '';

          grouped[dayTitle].push({
            time: activity.time,
            activity: activity.activity,
            lead: leadDisplay,
            location: activity.location || '',
            group: 'All'
          });
        });
      }
    });
    return grouped;
  };

  // Export to PDF functionality
  const exportToPDF = async () => {
    setLoading(true);
    try {
      const element = previewRef.current;
      
      if (!element) {
        throw new Error('Preview element not found');
      }

      // Get all sections that should be included in PDF
      const allPossibleSections = [
        { selector: '.hero-section', name: 'Cover' },
        { selector: '.overview-section', name: 'Introduction' },
        { selector: '.detail-section', name: 'Insights' },
        { selector: '.schedule-section', name: 'Schedule' },
        { selector: '.packingList-section', name: 'Packing List' },
        { selector: '.parking-section', name: 'Transportation' },
        { selector: '.nearbyHospital-section', name: 'Emergency Plan' },
        { selector: '.notes-section', name: 'Special Instructions' },
        { selector: '.contacts-section', name: 'Additional Contacts' },
        { selector: '.references-section', name: 'References' },
        { selector: '.weather-section', name: 'Weather Forecast' },
        { selector: '.footer-section', name: 'Footer' }
      ];

      // Only include sections that actually exist in the DOM (have content)
      const sections = allPossibleSections.filter(section => {
        const sectionElement = element.querySelector(section.selector);
        return sectionElement !== null;
      });

      console.log('PDF Export: Found sections to include:', sections.map(s => s.name));

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const usablePageHeight = pageHeight - (margin * 2);

      // Capture all sections first
      const sectionData = [];
      for (const section of sections) {
        const sectionElement = element.querySelector(section.selector);
        if (sectionElement) {
          console.log(`Capturing section: ${section.name}`);
          const canvas = await html2canvas(sectionElement, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff'
          });
          
          const imgData = canvas.toDataURL('image/png');
          const imgWidth = pageWidth - (margin * 2);
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          
          sectionData.push({
            name: section.name,
            imgData,
            imgHeight: imgHeight
          });
        }
      }

      // Intelligent page breaking algorithm
      const pages = [];
      let currentPage = [];
      let currentPageHeight = 0;

      for (const section of sectionData) {
        // If section is larger than a full page, give it its own page(s)
        if (section.imgHeight > usablePageHeight) {
          // Add current page if it has content
          if (currentPage.length > 0) {
            pages.push([...currentPage]);
            currentPage = [];
            currentPageHeight = 0;
          }
          
          // Add the large section on its own page
          pages.push([section]);
        } else {
          // Check if section fits on current page
          if (currentPageHeight + section.imgHeight <= usablePageHeight) {
            // Fits on current page
            currentPage.push(section);
            currentPageHeight += section.imgHeight;
          } else {
            // Doesn't fit, start new page
            if (currentPage.length > 0) {
              pages.push([...currentPage]);
            }
            currentPage = [section];
            currentPageHeight = section.imgHeight;
          }
        }
      }

      // Add remaining sections to final page
      if (currentPage.length > 0) {
        pages.push(currentPage);
      }

      console.log(`PDF Export: Organized into ${pages.length} pages`);

      // Generate PDF with organized pages
      let isFirstPage = true;
      for (const page of pages) {
        if (!isFirstPage) {
          pdf.addPage();
        }
        
        let yPosition = margin;
        for (const section of page) {
          const imgWidth = pageWidth - (margin * 2);
          
          // If section is taller than page, scale it down to fit
          let finalHeight = section.imgHeight;
          if (finalHeight > usablePageHeight) {
            finalHeight = usablePageHeight;
          }
          
          pdf.addImage(
            section.imgData,
            'PNG',
            margin,
            yPosition,
            imgWidth,
            finalHeight
          );
          
          yPosition += finalHeight;
        }
        
        isFirstPage = false;
      }

      // Save the PDF
      const fileName = `${outingData.eventName || 'Outing'}_Plan.pdf`;
      pdf.save(fileName);
      
      setSnackbar({ 
        open: true, 
        message: 'PDF exported successfully!', 
        severity: 'success' 
      });
    } catch (error) {
      console.error('PDF export error:', error);
      setSnackbar({ 
        open: true, 
        message: 'Error exporting PDF: ' + error.message, 
        severity: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  if (!outingData || Object.keys(outingData).length === 0) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '400px' 
      }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: isLiveView ? '100vh' : 'auto',
      backgroundColor: '#fff'
    }}>
      {/* Export PDF Button for Live View */}
      {showExportButton && (
        <Box sx={{ 
          position: 'fixed',
          top: 20,
          right: 20,
          zIndex: 1000
        }}>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={exportToPDF}
            disabled={loading}
            sx={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              px: 3,
              py: 1.5,
              borderRadius: 2,
              boxShadow: '0 4px 15px 0 rgba(102, 126, 234, 0.3)',
              '&:hover': {
                boxShadow: '0 6px 20px 0 rgba(102, 126, 234, 0.4)',
                transform: 'translateY(-1px)'
              }
            }}
          >
            {loading ? 'Generating PDF...' : 'Export PDF'}
          </Button>
        </Box>
      )}

      <Paper 
        ref={previewRef}
        sx={{ 
          backgroundColor: '#fff',
          minHeight: isLiveView ? '100vh' : '800px',
          boxShadow: 'none',
          borderRadius: 0,
          overflow: 'hidden'
        }}
      >
        {/* Bold Hero Section with Large Image */}
        <Box className="hero-section" sx={{ 
          position: 'relative',
          height: '100vh',
          minHeight: '600px',
          backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.6)), url(${getCoverBackgroundImage()})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white'
        }}>
          {/* Main Hero Content */}
          <Box sx={{ textAlign: 'center', px: 4 }}>
            <Typography 
              variant="h1" 
              component="h1" 
              sx={{ 
                fontSize: { xs: '3rem', md: '5rem', lg: '6rem' },
                fontWeight: 900,
                letterSpacing: '-0.04em',
                lineHeight: 0.9,
                mb: 6,
                textShadow: '0 4px 20px rgba(0,0,0,0.5)',
                color: '#ffffff'
              }}
            >
              {outingData.eventName || 'Outing Plan'}
            </Typography>
            
            <Typography 
              variant="h4" 
              sx={{ 
                fontSize: { xs: '1.5rem', md: '2rem' },
                fontWeight: 400,
                mb: 4,
                textShadow: '0 2px 10px rgba(0,0,0,0.5)',
                color: '#e0e0e0'
              }}
            >
              {outingData.startDateTime && outingData.endDateTime
                ? `${new Date(outingData.startDateTime).toLocaleDateString('en-US', { 
                    month: 'long', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })} - ${new Date(outingData.endDateTime).toLocaleDateString('en-US', { 
                    month: 'long', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}`
                : 'Adventure Dates TBD'
              }
            </Typography>

            {outingData.destination && (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                <svg width="1.2rem" height="1.2rem" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#e0e0e0' }}>
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                <Typography 
                  variant="h5" 
                  sx={{ 
                    fontSize: { xs: '1.2rem', md: '1.5rem' },
                    fontWeight: 300,
                    opacity: 1,
                    textShadow: '0 2px 10px rgba(0,0,0,0.5)',
                    color: '#e0e0e0'
                  }}
                >
                  {outingData.destination}
                </Typography>
              </Box>
            )}
          </Box>

          {/* SIC/AIC Info Overlay - Lower Right Corner */}
          {((outingData.sics && outingData.sics.length > 0) || (outingData.aics && outingData.aics.length > 0)) && (
            <Box sx={{
              position: 'absolute',
              bottom: 40,
              right: 40,
              backgroundColor: 'rgba(0, 0, 0, 0.2)',
              backdropFilter: 'blur(3px)',
              borderRadius: '5px',
              padding: '24px',
              minWidth: '250px',
              boxShadow: 'black 0 0 50px 10px',
              display: { xs: 'none', md: 'block' }
            }}>
              {outingData.sics && outingData.sics.length > 0 && (
                <Typography variant="body1" sx={{ color: 'white', mb: 1, fontWeight: 500 }}>
                  SICs: {outingData.sics.map(sic => sic.name).join(', ')}
                </Typography>
              )}
              {outingData.aics && outingData.aics.length > 0 && (
                <Typography variant="body1" sx={{ color: 'white', fontWeight: 500 }}>
                  AICs: {outingData.aics.map(aic => aic.name).join(', ')}
                </Typography>
              )}
            </Box>
          )}
        </Box>

        {/* Map Section */}
        {outingData.mapLink && outingData.mapLink.trim() !== '' && (
          <Box className="map-section" sx={{ 
            px: 4,
            py: 6,
            backgroundColor: '#f8f9fa'
          }}>
            <Typography variant="h6" sx={{ color: '#2c3e50', fontWeight: 600, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <LocationOnIcon sx={{ fontSize: '1.2rem', color: '#2c3e50' }} />
              Location & Directions {outingData.destination && `(${outingData.destination})`}{outingData.startPoint && ` - Starting from: ${outingData.startPoint}`}
            </Typography>
            <Box sx={{ height: 450, position: 'relative' }}>
              {(() => {
                const mapLink = outingData.mapLink;
                
                if (!mapLink) {
                  return (
                    <Box sx={{ 
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: 450,
                      backgroundColor: '#f8f9fa',
                      flexDirection: 'column',
                      border: '2px dashed #ddd',
                      borderRadius: 2
                    }}>
                      <LocationOnIcon sx={{ fontSize: 48, color: '#ccc', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary">
                        No map provided
                      </Typography>
                    </Box>
                  );
                }

                // Check if it's a Google Maps embed
                if (mapLink.includes('<iframe') && mapLink.includes('google.com/maps')) {
                  return (
                    <Box 
                      sx={{ 
                        width: '100%', 
                        height: '100%',
                        '& iframe': {
                          width: '100%',
                          height: '100%',
                          border: 'none',
                          borderRadius: 2
                        }
                      }}
                      dangerouslySetInnerHTML={{ __html: mapLink }}
                    />
                  );
                }

                // If it's just a URL, create an iframe
                if (mapLink.startsWith('http')) {
                  return (
                    <iframe
                      src={mapLink}
                      width="100%"
                      height="100%"
                      style={{ border: 'none', borderRadius: '8px' }}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Outing Location Map"
                    />
                  );
                }

                // Fallback for other formats
                return (
                  <Box sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: 450,
                    backgroundColor: '#f8f9fa',
                    flexDirection: 'column',
                    border: '2px dashed #ddd',
                    borderRadius: 2
                  }}>
                    <LocationOnIcon sx={{ fontSize: 48, color: '#ccc', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                      Invalid map format
                    </Typography>
                  </Box>
                );
              })()}
            </Box>
          </Box>
        )}

        {/* Overview Section */}
        {outingData.overview && outingData.overview.trim() !== '' && (
          <Box className="overview-section" sx={{ px: 4, py: 6 }}>
            <Typography variant="h6" sx={{ color: '#2c3e50', fontWeight: 600, mb: 3, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: 1 }}>
              <AssignmentIcon sx={{ fontSize: '1.2rem', color: '#2c3e50' }} />
              Introduction
            </Typography>
            <Typography 
              variant="body1" 
              className="rich-text-content"
              sx={{ lineHeight: 1.8, textAlign: 'left', fontSize: '1.0rem', padding: '0 24px', margin: '0 auto', color: '#2c3e50' }}
              dangerouslySetInnerHTML={{ __html: outingData.overview }}
            />
          </Box>
        )}

        {/* Detail Section */}
        {outingData.detail && outingData.detail.trim() !== '' && (
          <Box className="detail-section" sx={{ px: 4, py: 6, backgroundColor: '#f0e8ff' }}>
            <Typography variant="h6" sx={{ color: '#2c3e50', fontWeight: 600, mb: 3, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: 1 }}>
              <DescriptionIcon sx={{ fontSize: '1.2rem', color: '#2c3e50' }} />
              Insights
            </Typography>
            <Typography 
              variant="body1" 
              className="rich-text-content"
              sx={{ lineHeight: 1.8, textAlign: 'left', fontSize: '1.0rem', padding: '0 24px', margin: '0 auto', color: '#2c3e50' }}
              dangerouslySetInnerHTML={{ __html: outingData.detail }}
            />
          </Box>
        )}

        {/* Schedule Section */}
        {outingData.scheduleDays && outingData.scheduleDays.length > 0 && (
          <Box className="schedule-section" sx={{ 
            px: 4,
            py: 6,
            backgroundColor: '#f8f9fa'
          }}>
            <Typography variant="h6" sx={{ color: '#2c3e50', fontWeight: 600, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <ScheduleIconSvg sx={{ fontSize: '1.2rem', color: '#2c3e50' }} />
              Schedule
            </Typography>
            {Object.entries(groupActivitiesByDay()).map(([dayTitle, activities], dayIndex) => (
              <Box key={dayIndex} sx={{ mb: dayIndex < Object.keys(groupActivitiesByDay()).length - 1 ? 4 : 0 }}>
                <Typography variant="h6" sx={{ 
                  color: '#1976d2', 
                  fontWeight: 600, 
                  mb: 2,
                  fontSize: '1.1rem'
                }}>
                  {dayTitle}
                </Typography>
                <Box sx={{ 
                  display: 'grid', 
                  gap: 1,
                  gridTemplateColumns: 'auto 1fr auto auto',
                  alignItems: 'center'
                }}>
                  {activities.map((activity, actIndex) => (
                    <React.Fragment key={actIndex}>
                      <Typography variant="body2" sx={{ 
                        fontWeight: 500, 
                        color: '#666',
                        minWidth: '80px',
                        fontSize: '0.9rem'
                      }}>
                        {activity.time}
                      </Typography>
                      <Typography variant="body2" sx={{ 
                        color: '#2c3e50',
                        fontSize: '0.9rem'
                      }}>
                        {activity.activity}
                      </Typography>
                      <Typography variant="body2" sx={{ 
                        color: '#666',
                        fontStyle: 'italic',
                        fontSize: '0.85rem'
                      }}>
                        {activity.location}
                      </Typography>
                      <Typography variant="body2" sx={{ 
                        color: '#1976d2',
                        fontWeight: 500,
                        fontSize: '0.85rem'
                      }}>
                        {activity.lead}
                      </Typography>
                    </React.Fragment>
                  ))}
                </Box>
              </Box>
            ))}
          </Box>
        )}

        {/* Additional Sections */}
        {[
          { key: 'packingList', title: 'Packing List', icon: BackpackIcon },
          { key: 'parking', title: 'Transportation', icon: DirectionsCarIcon },
          { key: 'nearbyHospital', title: 'Emergency Plan', icon: LocalHospitalIcon },
          { key: 'notes', title: 'Special Instructions', icon: NotificationImportantIcon },
          { key: 'contacts', title: 'Additional Contacts', icon: ContactPhoneIcon },
          { key: 'references', title: 'References', icon: MenuBookIcon }
        ].filter(item => outingData[item.key] && outingData[item.key].trim() !== '').map((item, index) => (
          <Box key={item.key} className={`${item.key}-section`} sx={{ 
            px: 4,
            py: 6,
            backgroundColor: index % 2 === 0 ? '#f0f8ff' : '#fff8f0'
          }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50', fontWeight: 600, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <item.icon sx={{ fontSize: '1.2rem', color: '#2c3e50' }} />
              {item.title}
            </Typography>
            <Typography 
              variant="body1"
              className="rich-text-content"
              sx={{ 
                lineHeight: 1.8, 
                textAlign: 'left',
                color: '#2c3e50',
                fontSize: '1.0rem',
                padding: '0 24px',
                margin: '0 auto'
              }}
              dangerouslySetInnerHTML={{ __html: outingData[item.key] }}
            />
          </Box>
        ))}

        {/* Weather Forecast Section - Always show for PDF consistency */}
        {outingData.startDateTime && outingData.endDateTime ? (
          <WeatherForecast 
            startDate={outingData.startDateTime}
            endDate={outingData.endDateTime}
            location={outingData.destination}
          />
        ) : (
          <Box className="weather-section" sx={{ 
            px: 4,
            py: 6,
            backgroundColor: '#f0f8ff'
          }}>
            <Typography variant="h6" sx={{ 
              fontWeight: 600, 
              mb: 3, 
              textAlign: 'left', 
              color: '#2c3e50',
              fontSize: '1.2rem',
              display: 'flex', 
              alignItems: 'center', 
              gap: 1 
            }}>
              {/* Weather Icon SVG - Cloud with Sun */}
              <svg 
                width="1.2rem" 
                height="1.2rem" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="#2c3e50" 
                strokeWidth="1.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M6 16.326A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 0 9H6Z"/>
                <path d="m13 10-2 2 2 2"/>
                <path d="M10 6V4"/>
                <path d="M14 6V4"/>
                <path d="M6 10H4"/>
                <path d="M18 10h-2"/>
              </svg>
              Weather Forecast
              {outingData.destination && (
                <Typography 
                  component="span" 
                  sx={{ 
                    ml: 1, 
                    fontSize: '0.8rem', 
                    fontWeight: 400, 
                    color: '#666' 
                  }}
                >
                  ({outingData.destination})
                </Typography>
              )}
            </Typography>
            <Typography 
              variant="body1"
              sx={{ 
                lineHeight: 1.8, 
                textAlign: 'left',
                color: '#666',
                fontSize: '1.0rem',
                padding: '0 24px',
                margin: '0 auto',
                fontStyle: 'italic'
              }}
            >
              Weather forecast will be available once outing dates are set.
            </Typography>
          </Box>
        )}

        {/* Footer */}
        <Box className="footer-section" sx={{ 
          pt: 6, 
          pb: 6,
          borderTop: '1px solid #e9ecef',
          textAlign: 'center',
          backgroundColor: '#f8f9fa'
        }}>
          <Typography variant="h6" sx={{ color: '#2c3e50', fontWeight: 700 }}>
            Scouting America Troop 468
          </Typography>
          <Typography variant="body2" sx={{ color: '#6c757d', mt: 1 }}>
            Adventure • Spirit • Leadership
          </Typography>
        </Box>
      </Paper>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default OutingPreview;
