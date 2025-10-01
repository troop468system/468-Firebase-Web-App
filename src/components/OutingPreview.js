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
  Grid,
  TextField,
  FormControlLabel,
  Checkbox,
  RadioGroup,
  Radio,
  FormControl,
  FormLabel,
  IconButton,
  Container
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
  Schedule as ScheduleIconSvg,
  PersonAdd as PersonAddIcon,
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import LoginForm from './LoginForm';

// Weather code mapping for Open-Meteo API
const getWeatherFromCode = (code) => {
  const weatherCodes = {
    0: { condition: 'Clear', icon: '☀️' },
    1: { condition: 'Mainly Clear', icon: '🌤️' },
    2: { condition: 'Partly Cloudy', icon: '⛅' },
    3: { condition: 'Overcast', icon: '☁️' },
    45: { condition: 'Fog', icon: '🌫️' },
    48: { condition: 'Rime Fog', icon: '🌫️' },
    51: { condition: 'Light Drizzle', icon: '🌦️' },
    53: { condition: 'Moderate Drizzle', icon: '🌦️' },
    55: { condition: 'Dense Drizzle', icon: '🌧️' },
    56: { condition: 'Light Freezing Drizzle', icon: '🌨️' },
    57: { condition: 'Dense Freezing Drizzle', icon: '🌨️' },
    61: { condition: 'Slight Rain', icon: '🌦️' },
    63: { condition: 'Moderate Rain', icon: '🌧️' },
    65: { condition: 'Heavy Rain', icon: '🌧️' },
    66: { condition: 'Light Freezing Rain', icon: '🌨️' },
    67: { condition: 'Heavy Freezing Rain', icon: '🌨️' },
    71: { condition: 'Slight Snow', icon: '🌨️' },
    73: { condition: 'Moderate Snow', icon: '❄️' },
    75: { condition: 'Heavy Snow', icon: '❄️' },
    77: { condition: 'Snow Grains', icon: '🌨️' },
    80: { condition: 'Slight Showers', icon: '🌦️' },
    81: { condition: 'Moderate Showers', icon: '🌧️' },
    82: { condition: 'Violent Showers', icon: '⛈️' },
    85: { condition: 'Slight Snow Showers', icon: '🌨️' },
    86: { condition: 'Heavy Snow Showers', icon: '❄️' },
    95: { condition: 'Thunderstorm', icon: '⛈️' },
    96: { condition: 'Thunderstorm with Hail', icon: '⛈️' },
    99: { condition: 'Thunderstorm with Heavy Hail', icon: '⛈️' }
  };
  
  return weatherCodes[code] || { condition: 'Unknown', icon: '❓' };
};

// Weather Forecast Component
const WeatherForecast = ({ startDate, endDate, location }) => {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [warning, setWarning] = useState(null);

  React.useEffect(() => {
    console.log('WeatherForecast: useEffect triggered', { 
      startDate, 
      endDate, 
      location,
      startDateType: typeof startDate,
      endDateType: typeof endDate,
      startDateISO: startDate ? (startDate instanceof Date ? startDate.toISOString() : startDate.toString()) : 'null',
      endDateISO: endDate ? (endDate instanceof Date ? endDate.toISOString() : endDate.toString()) : 'null'
    });
    
    if (!startDate || !endDate) {
      console.log('WeatherForecast: Missing dates', { startDate, endDate });
      return;
    }

    const fetchWeatherData = async () => {
      setLoading(true);
      setError(null);
      setWarning(null);
      
      // Handle different date formats more robustly - move outside try block for scope
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

      // Normalize dates to ensure proper day-level comparison
      // Both dates should be normalized to midnight for consistent day-level comparisons
      console.log('WeatherForecast: Before normalization', {
        startOriginal: start.toISOString(),
        endOriginal: end.toISOString()
      });
      
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      
      // Check for invalid date ordering
      if (end < start) {
        console.error('WeatherForecast: End date is before start date - this is a form validation error');
        setError('Invalid date range: End date cannot be before start date. Please check your event dates.');
        setLoading(false);
        return;
      }
      
      console.log('WeatherForecast: After normalization and ordering', {
        startNormalized: start.toISOString(),
        endNormalized: end.toISOString()
      });
      
      try {

        // Default coordinates (San Francisco Bay Area) if no location provided
        let latitude = 37.7749;
        let longitude = -122.4194;
        
        // Try to geocode the location if provided
        if (location && location.trim()) {
          try {
            const geocodeResponse = await fetch(
              `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location.trim())}&count=1&language=en&format=json`
            );
            const geocodeData = await geocodeResponse.json();
            
            if (geocodeData.results && geocodeData.results.length > 0) {
              latitude = geocodeData.results[0].latitude;
              longitude = geocodeData.results[0].longitude;
              console.log(`WeatherForecast: Found coordinates for ${location}: ${latitude}, ${longitude}`);
            }
          } catch (geocodeError) {
            console.warn('WeatherForecast: Geocoding failed, using default coordinates', geocodeError);
          }
        }

        // Calculate days needed for forecast (inclusive of both start and end dates)
        const timeDiffMs = end.getTime() - start.getTime();
        const days = Math.floor(timeDiffMs / (1000 * 60 * 60 * 24)) + 1;
        const maxForecastDays = Math.min(days, 15); // Open-Meteo supports up to 15 days reliably
        
        // Check if dates are within reasonable forecast range
        const now = new Date();
        const daysDiff = Math.ceil((start - now) / (1000 * 60 * 60 * 24));
        
        console.log('WeatherForecast: Date analysis:', {
          now: now.toISOString(),
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          timeDiffMs: timeDiffMs,
          calculatedDays: days,
          maxForecastDays: maxForecastDays,
          daysDiff: daysDiff,
          isPast: daysDiff < -7,
          isFarFuture: daysDiff > 15
        });
        
        // Determine the actual date range we can fetch weather for
        let actualStartDate = start;
        let actualEndDate = end;
        let partialDataWarning = null;
        
        // Check if event starts too far in the past
        if (daysDiff < -7) {
          // Event starts more than 7 days ago - completely out of range
          console.log('WeatherForecast: Event starts too far in the past, showing error');
          throw new Error(`Weather forecast not available for past events (${Math.abs(daysDiff)} days ago). Historical weather data is not supported.`);
        }
        
        // Check if event starts too far in the future
        const endDaysDiff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
        if (daysDiff > 15) {
          // Event starts more than 15 days in the future - completely out of range
          console.log('WeatherForecast: Event starts too far in the future, showing error');
          throw new Error(`Weather forecast not available for events more than 15 days in the future (${daysDiff} days ahead). Please check closer to the event date.`);
        }
        
        // Check if event extends beyond the forecast limit
        if (endDaysDiff > 15) {
          // Event extends beyond 15 days - show partial data
          const maxEndDate = new Date(now);
          maxEndDate.setDate(now.getDate() + 15);
          maxEndDate.setHours(0, 0, 0, 0);
          actualEndDate = maxEndDate;
          
          const cutoffDateStr = actualEndDate.toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric' 
          });
          partialDataWarning = `Weather data shown through ${cutoffDateStr}. Forecast beyond this date is not available (too far in future).`;
          
          console.log('WeatherForecast: Event extends beyond forecast limit, showing partial data', {
            originalEndDate: end.toISOString(),
            adjustedEndDate: actualEndDate.toISOString(),
            warning: partialDataWarning
          });
        }
        
        // Use forecast API with actual date range we can support
        const startDateStr = actualStartDate.toISOString().split('T')[0];
        const endDateStr = actualEndDate.toISOString().split('T')[0];
        const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,apparent_temperature,weather_code&daily=sunrise,sunset&temperature_unit=fahrenheit&timezone=auto&start_date=${startDateStr}&end_date=${endDateStr}`;
        
        console.log('WeatherForecast: API URL:', apiUrl);
        console.log('WeatherForecast: Requesting date range:', {
          startDateStr: actualStartDate.toISOString().split('T')[0],
          endDateStr: actualEndDate.toISOString().split('T')[0],
          expectedDays: days
        });
        
        // Fetch weather data from Open-Meteo API
        const weatherResponse = await fetch(apiUrl);
        
        console.log('WeatherForecast: Response status:', weatherResponse.status);
        console.log('WeatherForecast: Response headers:', Object.fromEntries(weatherResponse.headers.entries()));
        
        if (!weatherResponse.ok) {
          const errorText = await weatherResponse.text();
          console.error('WeatherForecast: API Error Response:', errorText);
          throw new Error(`Weather API error: ${weatherResponse.status} - ${errorText}`);
        }
        
        const weatherApiData = await weatherResponse.json();
        console.log('WeatherForecast: API Response:', weatherApiData);
        
        // Validate API response structure
        if (!weatherApiData.daily || !weatherApiData.hourly) {
          console.error('WeatherForecast: Invalid API response structure:', weatherApiData);
          throw new Error('Invalid weather data format received from API');
        }
        
        // Transform API data to our format
        const transformedWeather = [];
        const dailyData = weatherApiData.daily;
        const hourlyData = weatherApiData.hourly;
        
        // Filter daily data to only include dates within our event range
        console.log('WeatherForecast: Processing daily data', {
          totalDays: dailyData.time.length,
          eventStart: start.toISOString().split('T')[0],
          eventEnd: end.toISOString().split('T')[0],
          apiDays: dailyData.time,
          apiDatesFormatted: dailyData.time.map(date => new Date(date).toISOString().split('T')[0])
        });
        
        for (let dayIndex = 0; dayIndex < dailyData.time.length; dayIndex++) {
          // Parse date string as local date to avoid timezone issues
          const apiDateStr = dailyData.time[dayIndex];
          const dayDate = new Date(apiDateStr + 'T00:00:00'); // Force local interpretation
          const dayDateStr = dayDate.toISOString().split('T')[0];
          const startDateStr = start.toISOString().split('T')[0];
          const endDateStr = end.toISOString().split('T')[0];
          
          console.log('WeatherForecast: Checking day', {
            rawApiDate: dailyData.time[dayIndex],
            dayDate: dayDate.toISOString(),
            dayDateStr: dayDateStr,
            eventStart: startDateStr,
            eventEnd: endDateStr,
            isWithinRange: dayDateStr >= startDateStr && dayDateStr <= endDateStr,
            formattedDisplay: dayDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
          });
          
          // Check if this day is within our event date range (compare date strings to avoid time issues)
          // Use more robust date comparison
          const dayDateOnly = new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate());
          const startDateOnly = new Date(start.getFullYear(), start.getMonth(), start.getDate());
          const endDateOnly = new Date(end.getFullYear(), end.getMonth(), end.getDate());
          
          const isInRange = dayDateOnly >= startDateOnly && dayDateOnly <= endDateOnly;
          
          console.log('WeatherForecast: Date comparison details', {
            dayDateOnly: dayDateOnly.toISOString(),
            startDateOnly: startDateOnly.toISOString(),
            endDateOnly: endDateOnly.toISOString(),
            isInRange: isInRange,
            stringComparison: dayDateStr >= startDateStr && dayDateStr <= endDateStr
          });
          
          if (isInRange) {
            const dayData = {
              date: dayDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
              sunrise: new Date(dailyData.sunrise[dayIndex]).toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit',
                hour12: true 
              }).toUpperCase(),
              sunset: new Date(dailyData.sunset[dayIndex]).toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit',
                hour12: true 
              }).toUpperCase(),
              hourlyData: []
            };
          
          // Extract hourly data for this day (1:00 PM to 10:00 PM)
          const dayStart = new Date(dayDate);
          dayStart.setHours(13, 0, 0, 0); // 1:00 PM
          
          for (let hour = 0; hour < 10; hour++) {
            const currentTime = new Date(dayStart.getTime() + hour * 60 * 60 * 1000);
            
            // Find the closest hourly data point (within 1 hour)
            let closestIndex = -1;
            let closestDiff = Infinity;
            
            for (let i = 0; i < hourlyData.time.length; i++) {
              const apiTime = new Date(hourlyData.time[i]);
              const timeDiff = Math.abs(apiTime.getTime() - currentTime.getTime());
              if (timeDiff < closestDiff && timeDiff <= 60 * 60 * 1000) { // Within 1 hour
                closestDiff = timeDiff;
                closestIndex = i;
              }
            }
            
            if (closestIndex !== -1) {
              const temp = hourlyData.temperature_2m[closestIndex];
              const feelsLike = hourlyData.apparent_temperature[closestIndex];
              const weatherCode = hourlyData.weather_code[closestIndex];
              
              // Validate data exists
              if (temp !== null && temp !== undefined && feelsLike !== null && feelsLike !== undefined) {
                // Convert weather codes to readable conditions
                const { condition, icon } = getWeatherFromCode(weatherCode || 0);
                
                dayData.hourlyData.push({
                  time: currentTime.toLocaleTimeString('en-US', { 
                    hour: 'numeric', 
                    minute: '2-digit',
                    hour12: true 
                  }).toLowerCase(),
                  condition: condition,
                  icon: icon,
                  temp: Math.round(temp),
                  feelsLike: Math.round(feelsLike)
                });
              } else {
                console.warn(`WeatherForecast: Missing data for ${currentTime.toISOString()}`);
              }
            } else {
              console.warn(`WeatherForecast: No hourly data found for ${currentTime.toISOString()}`);
            }
          }
          
          transformedWeather.push(dayData);
          }
        }
        
        console.log('WeatherForecast: Final transformed weather data', {
          expectedDays: days,
          actualDaysFound: transformedWeather.length,
          weatherData: transformedWeather,
          dateRange: {
            start: start.toISOString().split('T')[0],
            end: end.toISOString().split('T')[0]
          },
          partialDataWarning: partialDataWarning
        });
        
        // Add warning message if we're showing partial data
        if (partialDataWarning) {
          setWarning(partialDataWarning);
        }
        
        setWeatherData(transformedWeather);
        console.log('WeatherForecast: Successfully fetched', transformedWeather.length, 'days of weather data');
      } catch (err) {
        console.error('WeatherForecast: Error fetching weather data', err);
        
        // Check if this is a date range error - if so, don't attempt fallback
        if (err.message.includes('past events') || err.message.includes('more than 16 days in the future')) {
          console.log('WeatherForecast: Date range error, showing specific message without fallback data');
          setError(err.message);
          setLoading(false);
          return;
        }
        
        // Try to provide a fallback with basic weather info for other errors
        try {
          console.log('WeatherForecast: Attempting fallback weather data');
          const fallbackWeather = [];
          const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
          
          for (let i = 0; i < days; i++) {
            const date = new Date(start);
            date.setDate(start.getDate() + i);
            
            const dayData = {
              date: date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
              sunrise: '6:30AM',
              sunset: '7:30PM',
              hourlyData: []
            };
            
            // Generate simple hourly data
            for (let hour = 0; hour < 10; hour++) {
              const currentHour = 13 + hour; // 1:00 PM to 10:00 PM
              const displayHour = currentHour > 12 ? currentHour - 12 : currentHour;
              const ampm = currentHour >= 12 ? 'pm' : 'am';
              
              dayData.hourlyData.push({
                time: `${displayHour}:00 ${ampm}`,
                condition: 'Weather Unavailable',
                icon: '❓',
                temp: '--',
                feelsLike: '--'
              });
            }
            
            fallbackWeather.push(dayData);
          }
          
          setWeatherData(fallbackWeather);
          setError('Weather data temporarily unavailable. Showing placeholder information.');
          
        } catch (fallbackErr) {
          console.error('WeatherForecast: Fallback also failed', fallbackErr);
          setError('Failed to fetch weather data. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchWeatherData();
  }, [startDate, endDate, location]);

  // Removed unused getWeatherIcon helper

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
        backgroundColor: '#f8f9fa',
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
        backgroundColor: '#fff3e0',
        border: '1px solid #ffb74d',
        borderRadius: 2
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
          {/* Warning Icon */}
          <svg 
            width="1.2rem" 
            height="1.2rem" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="#ff9800" 
            strokeWidth="2"
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
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
        
        {/* Main error message */}
        <Typography 
          variant="body1"
          sx={{ 
            lineHeight: 1.8, 
            textAlign: 'left',
            color: '#f57c00',
            fontSize: '1.0rem',
            fontWeight: 500,
            mb: 2,
            padding: '0 24px'
          }}
        >
          {error}
        </Typography>
        
        {/* Helpful additional info */}
        <Typography 
          variant="body2"
          sx={{ 
            lineHeight: 1.6, 
            textAlign: 'left',
            color: '#666',
            fontSize: '0.9rem',
            fontStyle: 'italic',
            padding: '0 24px'
          }}
        >
          {error.includes('past events') 
            ? 'Historical weather data is not available through our weather service.'
            : error.includes('more than 16 days in the future')
            ? 'Weather forecasts are most accurate within 16 days. Please check back closer to your event date.'
            : 'Weather information will be available when the forecast service is accessible.'
          }
        </Typography>
      </Box>
    );
  }

  if (!weatherData) {
    return (
      <Box className="weather-section" sx={{ 
        px: 4,
        py: 6,
        backgroundColor: '#f8f9fa'
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

  // Check if weather data is empty array
  if (weatherData && weatherData.length === 0) {
    console.log('WeatherForecast: Weather data is empty array', { weatherData });
    return (
      <Box className="weather-section" sx={{ 
        px: 4,
        py: 6,
        backgroundColor: '#fff3e0',
        border: '1px solid #ffb74d',
        borderRadius: 2
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
            stroke="#ff9800" 
            strokeWidth="2"
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
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
            color: '#f57c00',
            fontSize: '1.0rem',
            fontWeight: 500,
            mb: 2,
            padding: '0 24px'
          }}
        >
          No weather data found for the selected event dates.
        </Typography>
        <Typography 
          variant="body2"
          sx={{ 
            lineHeight: 1.6, 
            textAlign: 'left',
            color: '#666',
            fontSize: '0.9rem',
            fontStyle: 'italic',
            padding: '0 24px'
          }}
        >
          The event dates may not match the available forecast period. Please check the browser console for detailed debugging information.
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
      backgroundColor: '#f8f9fa'
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
      
      {/* Warning message for partial data */}
      {warning && (
        <Box sx={{
          mb: 3,
          p: 2,
          backgroundColor: '#fff3e0',
          border: '1px solid #ffb74d',
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          {/* Warning Icon */}
          <svg 
            width="1rem" 
            height="1rem" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="#ff9800" 
            strokeWidth="2"
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <Typography variant="body2" sx={{ 
            color: '#f57c00',
            fontSize: '0.9rem',
            fontWeight: 500
          }}>
            {warning}
          </Typography>
        </Box>
      )}
      
      {/* Weather Data in Rows of 3 Days */}
      {groupedDays.map((dayGroup, groupIndex) => (
        <Card key={groupIndex} sx={{ 
          mb: 3, 
          borderRadius: 3,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          border: '1px solid rgba(0,0,0,0.05)',
          backgroundColor: '#ffffff',
          color: '#2c3e50'
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
                      {day.date}
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
                  color: '#2c3e50'
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
                          color: '#2c3e50',
                          '&:hover': {
                            backgroundColor: '#f8f9fa'
                          }
                        }}
                      >
                        <Grid item xs={3}>
                          <Typography variant="caption" sx={{ color: '#2c3e50 !important', fontSize: '0.7rem' }}>
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
  
  // Authentication state
  const auth = getAuth();
  const [user, setUser] = useState(null);
  // Removed unused authLoading state
  
  // Sign-up form state
  const [isFlipped, setIsFlipped] = useState(false);
  const [signUpData, setSignUpData] = useState({
    name: '',
    email: '',
    attending: '',
    needCarpool: false,
    carpoolDetails: '',
    specialRequests: ''
  });
  const [signUpLoading, setSignUpLoading] = useState(false);

  // Authentication state listener
  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, [auth]);

  // Force MUI Tabs to recalculate indicator position after flip
  React.useEffect(() => {
    console.log('isFlipped state changed to:', isFlipped);
    if (isFlipped) {
      console.log('Flipping to signup view - triggering resize event');
      // Small delay to ensure flip animation is complete
      const timer = setTimeout(() => {
        // Trigger a window resize event to force MUI Tabs to recalculate
        window.dispatchEvent(new Event('resize'));
      }, 100);
      return () => clearTimeout(timer);
    } else {
      console.log('Flipping back to main view');
    }
  }, [isFlipped]);


  // Load outing data for live view
  React.useEffect(() => {
    if (isLiveView && eventId && onLoadOuting) {
      onLoadOuting(eventId);
    }
  }, [isLiveView, eventId, onLoadOuting]);

  // Fix broken blob URLs in preview (same as editor)
  React.useEffect(() => {
    const fixBrokenBlobImagesInPreview = async () => {
      const previewImages = document.querySelectorAll('.preview-content-wrapper img');
      
      for (const img of previewImages) {
        // Skip if already processed
        if (img.dataset.processed) continue;
        
        const originalUrl = img.getAttribute('data-original-url');
        
        // Only process images that have an original URL backup
        if (!originalUrl) continue;
        
        const handleBrokenPreviewImage = async () => {
          console.log('Preview: Broken blob URL detected, converting to new blob URL:', img.src, '→', originalUrl);
          
          try {
            // Import the googleDriveService dynamically to avoid circular imports
            const { default: googleDriveService } = await import('../services/googleDriveService');
            
            // Use the same conversion method as the editor
            const newBlobUrl = await googleDriveService.convertToEditorUrl(originalUrl);
            console.log('Preview: Successfully converted to new blob URL:', newBlobUrl);
            
            img.src = newBlobUrl;
            img.dataset.processed = 'true';
            img.removeAttribute('data-original-url');
          } catch (error) {
            console.error('Preview: Failed to convert original URL to blob URL:', error);
            img.dataset.processed = 'true';
            img.removeAttribute('data-original-url');
          }
        };
        
        // Check if image is already broken (common after page refresh)
        if (img.complete && img.naturalWidth === 0) {
          await handleBrokenPreviewImage();
        } else {
          // Listen for future errors (blob URL expiration)
          img.addEventListener('error', handleBrokenPreviewImage, { once: true });
          
          // Special handling for blob URLs - they often fail after refresh
          if (img.src.startsWith('blob:')) {
            // Give blob URL a chance, but if it fails after a short time, convert
            setTimeout(async () => {
              if (img.naturalWidth === 0 && !img.dataset.processed) {
                console.log('Preview: Blob URL failed to load, converting...');
                await handleBrokenPreviewImage();
              }
            }, 1000);
          }
        }
      }
    };

    // Run after a delay to ensure content is rendered
    const timer = setTimeout(fixBrokenBlobImagesInPreview, 500);
    
    // Also run when outingData changes
    if (outingData) {
      setTimeout(fixBrokenBlobImagesInPreview, 1000);
    }
    
    return () => clearTimeout(timer);
  }, [outingData]);

  // Initialize form data when user is authenticated
  React.useEffect(() => {
    if (user && isFlipped) {
      setSignUpData(prev => ({
        ...prev,
        name: user.displayName || '',
        email: user.email || ''
      }));
    }
  }, [user, isFlipped]);

  // Handle sign-up button click
  const handleSignUpClick = () => {
    console.log('Sign up button clicked, flipping to signup view');
    setIsFlipped(true);
  };

  // Handle back button click
  const handleBackClick = () => {
    console.log('Back button clicked, flipping back to main view');
    setIsFlipped(false);
  };

  // Handle form input changes
  const handleSignUpInputChange = (field, value) => {
    setSignUpData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle sign-up form submission
  const handleSignUpSubmit = async () => {
    if (!user) {
      setSnackbar({
        open: true,
        message: 'Please log in first to sign up for this event.',
        severity: 'warning'
      });
      return;
    }

    if (!signUpData.attending) {
      setSnackbar({
        open: true,
        message: 'Please select whether you will be attending.',
        severity: 'warning'
      });
      return;
    }

    setSignUpLoading(true);
    try {
      // Here you would typically save the sign-up data to Firestore
      // For now, we'll just simulate a successful save
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      setSnackbar({
        open: true,
        message: 'Successfully signed up for the event!',
        severity: 'success'
      });
      
      // Flip back to the main view
      setTimeout(() => {
        setIsFlipped(false);
      }, 1500);
      
    } catch (error) {
      console.error('Error signing up:', error);
      setSnackbar({
        open: true,
        message: 'Error signing up for event. Please try again.',
        severity: 'error'
      });
    } finally {
      setSignUpLoading(false);
    }
  };

  // Handle login success
  const handleLoginSuccess = (user) => {
    setSnackbar({
      open: true,
      message: 'Successfully signed in!',
      severity: 'success'
    });
    // Form data will be updated by the useEffect when user state changes
  };

  // Handle login error
  const handleLoginError = (error) => {
    setSnackbar({
      open: true,
      message: 'Error signing in. Please try again.',
      severity: 'error'
    });
  };

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
      sport: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?ixlib=rb-4.0.3&auto=format&fit=crop&w=2560&q=80',
      bluesky: 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?ixlib=rb-4.0.3&auto=format&fit=crop&w=2560&q=80'
    };
    return imageMap[outingData.coverImage] || imageMap.bluesky;
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
        { selector: '.detail-section', name: 'Plan' },
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
    <Box  id="preview-root" sx={{ 
      minHeight: isLiveView ? '100vh' : 'auto',
      backgroundColor: '#fff'
    }}>
      {/* Action Buttons for Live View - Hide when in signup view */}
      {showExportButton && !isFlipped && (
        <Box sx={{ 
          position: 'fixed',
          top: 20,
          right: 20,
          zIndex: 1000,
          display: 'flex',
          gap: 2
        }}>
          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={handleSignUpClick}
            sx={{ 
              background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
              color: 'white',
              px: 3,
              py: 1.5,
              borderRadius: 2,
              boxShadow: '0 4px 15px 0 rgba(76, 175, 80, 0.3)',
              '&:hover': {
                boxShadow: '0 6px 20px 0 rgba(76, 175, 80, 0.4)',
                transform: 'translateY(-1px)'
              }
            }}
          >
            Sign Up
          </Button>
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

      {/* Hero Section - Always rendered for PDF, hidden when flipped */}
      <Box sx={{ display: isFlipped ? 'none' : 'block' }}>
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
          color: 'white',
          zIndex: 1
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
              {(() => {
                if (!outingData.startDateTime || !outingData.endDateTime) {
                  return 'Adventure Dates TBD';
                }

                // Helper function to safely parse dates
                const parseDate = (dateValue) => {
                  if (dateValue instanceof Date && !isNaN(dateValue.getTime())) {
                    return dateValue;
                  } else if (dateValue) {
                    if (typeof dateValue === 'object' && dateValue.toDate) {
                      // Firestore timestamp
                      return dateValue.toDate();
                    } else if (typeof dateValue === 'string' || typeof dateValue === 'number') {
                      const parsed = new Date(dateValue);
                      if (!isNaN(parsed.getTime())) {
                        return parsed;
                      }
                    }
                  }
                  return null;
                };

                const startDate = parseDate(outingData.startDateTime);
                const endDate = parseDate(outingData.endDateTime);

                if (!startDate || !endDate) {
                  return 'Adventure Dates TBD';
                }

                const formatOptions = { 
                  weekday: 'short',
                  month: 'long', 
                  day: 'numeric', 
                  year: 'numeric' 
                };

                return `${startDate.toLocaleDateString('en-US', formatOptions)} - ${endDate.toLocaleDateString('en-US', formatOptions)}`;
              })()}
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
      </Box>

      {/* Flip Container */}
      <Box id="signup-root"
        sx={{
          perspective: '1000px',
          minHeight: isLiveView ? '100vh' : 'auto',
          height: 'auto',
          width: '100%',
          maxWidth: '100%',
          maxHeight: '100vh',
          overflow: isFlipped ? 'hidden' : 'visible',
          boxSizing: 'border-box'
        }}
      >
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            minHeight: isLiveView ? '100vh' : 'auto',
            height: 'auto',
            maxWidth: '100%',
            overflow: 'visible',
            transformStyle: 'preserve-3d',
            transition: 'transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            boxSizing: 'border-box'
          }}
        >
          {/* Front Side - Outing Preview */}
          <Paper 
            ref={previewRef}
            sx={{ 
              position: 'relative',
              width: '100%',
              backgroundColor: '#fff',
              minHeight: isLiveView ? '100vh' : 'auto',
              height: 'auto',
              boxShadow: 'none',
              borderRadius: 0,
              overflow: 'visible',
              overflowWrap: 'break-word',
              wordBreak: 'break-word',
              boxSizing: 'border-box',
              backfaceVisibility: 'hidden'
            }}
          >

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
          <Box className="overview-section" sx={{ 
            px: 4, 
            py: 6, 
            backgroundColor: '#f8f9fa',
            width: '100%',
            maxWidth: '100%',
            overflow: 'hidden',
            wordWrap: 'break-word',
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
            boxSizing: 'border-box',
            minHeight: 'fit-content',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <Typography variant="h6" sx={{ color: '#2c3e50', fontWeight: 600, mb: 3, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: 1 }}>
              <AssignmentIcon sx={{ fontSize: '1.2rem', color: '#2c3e50' }} />
              Introduction
            </Typography>
            <div
              style={{
                width: '100%',
                maxWidth: '100%',
                overflow: 'hidden',
                padding: '0 16px',
                boxSizing: 'border-box',
                minHeight: 'fit-content',
                flex: '1 1 auto'
              }}
            >
              <Typography 
                variant="body1" 
                className="rich-text-content preview-content-wrapper"
                sx={{ 
                  lineHeight: 1.8, 
                  textAlign: 'left', 
                  fontSize: '1.0rem', 
                  margin: '0', 
                  padding: '0',
                  color: '#2c3e50',
                  width: '100%',
                  maxWidth: '100%',
                  wordWrap: 'break-word',
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                  whiteSpace: 'normal',
                  boxSizing: 'border-box',
                  '& *': {
                    maxWidth: '100% !important',
                    wordWrap: 'break-word !important',
                    wordBreak: 'break-word !important',
                    overflowWrap: 'break-word !important',
                    whiteSpace: 'normal !important',
                    boxSizing: 'border-box !important',
                    color: '#2c3e50 !important'
                  }
                }}
                dangerouslySetInnerHTML={{ __html: outingData.overview }}
              />
            </div>
          </Box>
        )}

        {/* Detail Section */}
        {outingData.detail && outingData.detail.trim() !== '' && (
          <Box className="detail-section" sx={{ 
            px: 4, 
            py: 6, 
            backgroundColor: '#f8f9fa',
            width: '100%',
            maxWidth: '100%',
            overflow: 'hidden',
            wordWrap: 'break-word',
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
            boxSizing: 'border-box',
            minHeight: 'fit-content',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <Typography variant="h6" sx={{ color: '#2c3e50', fontWeight: 600, mb: 3, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: 1 }}>
              <DescriptionIcon sx={{ fontSize: '1.2rem', color: '#2c3e50' }} />
              Plan
            </Typography>
            <div
              style={{
                width: '100%',
                maxWidth: '100%',
                overflow: 'hidden',
                padding: '0 16px',
                boxSizing: 'border-box',
                minHeight: 'fit-content',
                flex: '1 1 auto'
              }}
            >
              <Typography 
                variant="body1" 
                className="rich-text-content preview-content-wrapper"
                sx={{ 
                  lineHeight: 1.8, 
                  textAlign: 'left', 
                  fontSize: '1.0rem', 
                  margin: '0', 
                  padding: '0',
                  color: '#2c3e50',
                  width: '100%',
                  maxWidth: '100%',
                  wordWrap: 'break-word',
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                  whiteSpace: 'normal',
                  boxSizing: 'border-box',
                  '& *': {
                    maxWidth: '100% !important',
                    wordWrap: 'break-word !important',
                    wordBreak: 'break-word !important',
                    overflowWrap: 'break-word !important',
                    whiteSpace: 'normal !important',
                    boxSizing: 'border-box !important',
                    color: '#2c3e50 !important'
                  }
                }}
                dangerouslySetInnerHTML={{ __html: outingData.detail }}
              />
            </div>
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
            backgroundColor: '#f8f9fa',
            width: '100%',
            maxWidth: '100%',
            overflow: 'hidden',
            wordWrap: 'break-word',
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
            boxSizing: 'border-box',
            minHeight: 'fit-content',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50', fontWeight: 600, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <item.icon sx={{ fontSize: '1.2rem', color: '#2c3e50' }} />
              {item.title}
            </Typography>
            <div
              style={{
                width: '100%',
                maxWidth: '100%',
                overflow: 'hidden',
                padding: '0 16px',
                boxSizing: 'border-box',
                minHeight: 'fit-content',
                flex: '1 1 auto'
              }}
            >
              <Typography 
                variant="body1"
                className="rich-text-content preview-content-wrapper"
                sx={{ 
                  lineHeight: 1.8, 
                  textAlign: 'left',
                  color: '#2c3e50',
                  fontSize: '1.0rem',
                  margin: '0',
                  padding: '0',
                  width: '100%',
                  maxWidth: '100%',
                  wordWrap: 'break-word',
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                  whiteSpace: 'normal',
                  boxSizing: 'border-box',
                  '& *': {
                    maxWidth: '100% !important',
                    wordWrap: 'break-word !important',
                    wordBreak: 'break-word !important',
                    overflowWrap: 'break-word !important',
                    whiteSpace: 'normal !important',
                    boxSizing: 'border-box !important',
                    color: '#2c3e50 !important'
                  }
                }}
                dangerouslySetInnerHTML={{ __html: outingData[item.key] }}
              />
            </div>
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
            backgroundColor: '#f8f9fa'
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

      {/* Back Side - Sign-up Form */}
      <Paper
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          background: `
            linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.8)),
            url('https://images.unsplash.com/photo-1531147646552-1eec68116469')
          `,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          minHeight: isLiveView ? '100vh' : 'auto',
          boxShadow: 'none',
          borderRadius: 0,
          overflow: 'auto',
          backfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
          display: isFlipped ? 'block' : 'none'
        }}
      >
        {/* Back Button */}
        <IconButton
          onClick={handleBackClick}
          sx={{
            position: 'fixed',
            top: 20,
            left: 20,
            zIndex: 1000,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 1)',
            }
          }}
        >
          <ArrowBackIcon />
        </IconButton>

        <Container id="signup-form" maxWidth="md" sx={{ 
          py: 8,
          backgroundColor: 'transparent'
        }}>
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography variant="h3" component="h1" sx={{ 
              fontWeight: 700, 
              color: '#4caf50', 
              mb: 2,
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
            }}>
              Sign Up for {outingData.eventName || 'Event'}
            </Typography>
            <Typography variant="body1" sx={{ 
              color: 'rgba(255, 255, 255, 0.9)', 
              mt: 1,
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)'
            }}>
              {(() => {
                if (!outingData.startDateTime || !outingData.endDateTime) {
                  return 'Adventure Dates TBD';
                }

                // Helper function to safely parse dates
                const parseDate = (dateValue) => {
                  if (dateValue instanceof Date && !isNaN(dateValue.getTime())) {
                    return dateValue;
                  } else if (dateValue) {
                    if (typeof dateValue === 'object' && dateValue.toDate) {
                      // Firestore timestamp
                      return dateValue.toDate();
                    } else if (typeof dateValue === 'number' || typeof dateValue === 'string') {
                      const parsed = new Date(dateValue);
                      return !isNaN(parsed.getTime()) ? parsed : null;
                    }
                  }
                  return null;
                };

                const startDate = parseDate(outingData.startDateTime);
                const endDate = parseDate(outingData.endDateTime);

                if (!startDate || !endDate) {
                  return 'Adventure Dates TBD';
                }

                const startFormatted = startDate.toLocaleDateString('en-US', { 
                  weekday: 'short',
                  month: 'long', 
                  day: 'numeric', 
                  year: 'numeric' 
                });
                const endFormatted = endDate.toLocaleDateString('en-US', { 
                  weekday: 'short',
                  month: 'long', 
                  day: 'numeric', 
                  year: 'numeric' 
                });

                return `${startFormatted} - ${endFormatted}`;
              })()}
            </Typography>
          </Box>

          {/* Authentication Check */}
          {!user ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
              <LoginForm
                onSuccess={handleLoginSuccess}
                onError={handleLoginError}
                showRegistration={true}
                title="Sign In to Register"
                subtitle="You need to be signed in to register for this event"
                showGreenLine={false}
                defaultTab={0}
                inFlippedContainer={true}
              />
            </Box>
          ) : (
            <Card className="signup-form-card" sx={{ 
              p: 4,
              borderRadius: 3
            }}>
              <Typography variant="h5" sx={{ mb: 3, color: '#4caf50' }}>
                Event Registration
              </Typography>
              
              <Grid container spacing={3}>
                {/* Name */}
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    value={signUpData.name}
                    onChange={(e) => handleSignUpInputChange('name', e.target.value)}
                    variant="outlined"
                    disabled
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      }
                    }}
                  />
                </Grid>

                {/* Email */}
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    value={signUpData.email}
                    onChange={(e) => handleSignUpInputChange('email', e.target.value)}
                    variant="outlined"
                    disabled
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      }
                    }}
                  />
                </Grid>

                {/* Attendance */}
                <Grid item xs={12}>
                  <FormControl component="fieldset">
                    <FormLabel component="legend" sx={{ mb: 2, color: '#4caf50', fontWeight: 600 }}>
                      Will you be attending this event? *
                    </FormLabel>
                    <RadioGroup
                      value={signUpData.attending}
                      onChange={(e) => handleSignUpInputChange('attending', e.target.value)}
                      row
                    >
                      <FormControlLabel value="yes" control={<Radio />} label="Yes, I'll attend" />
                      <FormControlLabel value="no" control={<Radio />} label="No, I can't attend" />
                      <FormControlLabel value="maybe" control={<Radio />} label="Maybe/Tentative" />
                    </RadioGroup>
                  </FormControl>
                </Grid>

                {/* Carpool */}
                {signUpData.attending === 'yes' && (
                  <>
                    <Grid item xs={12}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={signUpData.needCarpool}
                            onChange={(e) => handleSignUpInputChange('needCarpool', e.target.checked)}
                          />
                        }
                        label="I need carpool assistance"
                      />
                    </Grid>

                    {signUpData.needCarpool && (
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Carpool Details"
                          value={signUpData.carpoolDetails}
                          onChange={(e) => handleSignUpInputChange('carpoolDetails', e.target.value)}
                          variant="outlined"
                          multiline
                          rows={3}
                          placeholder="Please provide your location and any specific carpool needs..."
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                            }
                          }}
                        />
                      </Grid>
                    )}
                  </>
                )}

                {/* Special Requests */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Special Requests or Dietary Restrictions"
                    value={signUpData.specialRequests}
                    onChange={(e) => handleSignUpInputChange('specialRequests', e.target.value)}
                    variant="outlined"
                    multiline
                    rows={3}
                    placeholder="Any dietary restrictions, medical needs, or special accommodations..."
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      }
                    }}
                  />
                </Grid>

                {/* Submit Button */}
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                    <Button
                      variant="contained"
                      size="large"
                      startIcon={<SaveIcon />}
                      onClick={handleSignUpSubmit}
                      disabled={signUpLoading || !signUpData.attending}
                      sx={{
                        background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
                        color: 'white',
                        px: 6,
                        py: 1.5,
                        fontSize: '1.1rem',
                        textTransform: 'none',
                        borderRadius: 2,
                        boxShadow: '0 4px 15px 0 rgba(76, 175, 80, 0.3)',
                        '&:hover': {
                          boxShadow: '0 6px 20px 0 rgba(76, 175, 80, 0.4)',
                          transform: 'translateY(-1px)'
                        },
                        '&:disabled': {
                          background: '#ccc'
                        }
                      }}
                    >
                      {signUpLoading ? <CircularProgress size={20} color="inherit" /> : 'Save Registration'}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Card>
          )}
        </Container>
      </Paper>

      {/* Close flip container */}
      </Box>
      </Box>

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
