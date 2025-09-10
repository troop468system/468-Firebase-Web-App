import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import TiptapEditor from '../components/TiptapEditor';
import OutingPreview from '../components/OutingPreview';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Box,
  Paper,
  Tabs,
  Tab,
  Typography,
  TextField,
  Button,
  Grid,
  Chip,
  IconButton,
  Card,
  CardContent,
  Alert,
  Snackbar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Switch,
  Tooltip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  InputAdornment,
  Link,
  Autocomplete,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  GetApp as DownloadIcon,
  OpenInNew as OpenInNewIcon,
  Preview as PreviewIcon,
  Edit as EditIcon,
  Schedule as ScheduleIcon,
  People as PeopleIcon,
  ExpandMore as ExpandMoreIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Event as EventIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  DragHandle as DragHandleIcon,
  Assignment as AssignmentIcon,
  Description as DescriptionIcon,
  Backpack as BackpackIcon,
  DirectionsCar as DirectionsCarIcon,
  LocalHospital as LocalHospitalIcon,
  NotificationImportant as NotificationImportantIcon,
  ContactPhone as ContactPhoneIcon,
  MenuBook as MenuBookIcon,
  CameraAlt as CameraAltIcon,
  LocationOn as LocationOnIcon,
  Flag as FlagIcon,
  Map as MapIcon,
  Target as TargetIcon,
  Info as InfoIcon,
  Close as CloseIcon,
  Schedule as ScheduleIconSvg,
  Room as RoomIcon
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import PageTitle from '../components/PageTitle';
import outingService from '../services/outingService';
import authService from '../services/authService';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`outing-tabpanel-${index}`}
      aria-labelledby={`outing-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

// Sortable Activity Item Component
const SortableActivityItem = ({ activity, onUpdate, onDelete, scouts }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: activity.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Generate common time options
  const timeOptions = [
    '6:00 AM', '6:30 AM', '7:00 AM', '7:30 AM', '8:00 AM', '8:30 AM', '9:00 AM', '9:30 AM',
    '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
    '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM',
    '5:00 PM', '5:30 PM', '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM',
    '9:00 PM', '9:30 PM', '10:00 PM', '10:30 PM', '11:00 PM', '11:30 PM'
  ];

  // Handle lead field as array of scouts for multiple selection
  const getSelectedLeads = () => {
    if (!activity.lead) return [];
    
    // If lead is a string (legacy format), convert to array
    if (typeof activity.lead === 'string') {
      if (!activity.lead.trim()) return [];
      // Split by comma and find matching scouts
      const leadNames = activity.lead.split(',').map(name => name.trim());
      return leadNames.map(name => 
        scouts?.find(scout => scout.name === name) || { name, rank: 'Unknown', patrol: 'Unknown' }
      ).filter(Boolean);
    }
    
    // If lead is already an array
    if (Array.isArray(activity.lead)) {
      return activity.lead;
    }
    
    return [];
  };

  const selectedLeads = getSelectedLeads();

  return (
    <Card 
      ref={setNodeRef} 
      style={style} 
      sx={{ 
        mb: 2, 
        boxShadow: 1,
        '&:hover': {
          boxShadow: 2
        }
      }}
    >
      <CardContent sx={{ p: 2 }}>
        <Grid container spacing={1} alignItems="center" sx={{ minHeight: '56px' }}>
          <Grid item xs="auto">
            <IconButton 
              {...attributes} 
              {...listeners}
              size="small"
              sx={{ cursor: 'grab', '&:active': { cursor: 'grabbing' }, minWidth: '32px' }}
            >
              <DragHandleIcon fontSize="small" />
            </IconButton>
          </Grid>
          <Grid item xs={2.5} sm={2}>
            <Autocomplete
              options={timeOptions}
              value={activity.time || ''}
              onChange={(event, newValue) => {
                onUpdate({ ...activity, time: newValue || '' });
              }}
              freeSolo
              isOptionEqualToValue={(option, value) => option === value}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Time"
                  placeholder="9:00 AM"
                  variant="outlined"
                  size="small"
                  sx={{ 
                    borderRadius: 2,
                    '& .MuiInputBase-input': { fontSize: '0.875rem' }
                  }}
                />
              )}
            />
          </Grid>
          <Grid item xs={4} sm={4}>
            <TextField
              fullWidth
              label="Activity"
              placeholder="Activity description"
              value={activity.activity}
              onChange={(e) => onUpdate({ ...activity, activity: e.target.value })}
              variant="outlined"
              size="small"
              sx={{ 
                borderRadius: 2,
                '& .MuiInputBase-input': { fontSize: '0.875rem' }
              }}
            />
          </Grid>
          <Grid item xs={2} sm={2}>
            <TextField
              fullWidth
              label="Location"
              placeholder="Where?"
              value={activity.location || ''}
              onChange={(e) => onUpdate({ ...activity, location: e.target.value })}
              variant="outlined"
              size="small"
              sx={{ 
                borderRadius: 2,
                '& .MuiInputBase-input': { fontSize: '0.875rem' }
              }}
            />
          </Grid>
          <Grid item xs={2.5} sm={3}>
            <Autocomplete
              multiple
              options={scouts || []}
              value={selectedLeads}
              onChange={(event, newValue) => {
                // Store as array for consistency with SICs/AICs
                onUpdate({ ...activity, lead: newValue });
              }}
              getOptionLabel={(option) => option?.name || ''}
              isOptionEqualToValue={(option, value) => 
                option.name === value.name && option.role === value.role
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Lead"
                  placeholder="Who?"
                  variant="outlined"
                  size="small"
                  sx={{ 
                    borderRadius: 2,
                    '& .MuiInputBase-input': { fontSize: '0.875rem' }
                  }}
                  helperText=""
                />
              )}
              renderOption={(props, option) => (
                <Box component="li" {...props}>
                  <Box>
                    <Typography variant="body2" fontWeight="medium">
                      {option.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.patrol || 'No Patrol'}
                    </Typography>
                  </Box>
                </Box>
              )}
              renderTags={(tagValue, getTagProps) =>
                tagValue.map((option, index) => {
                  const { key, ...chipProps } = getTagProps({ index });
                  return (
                  <Chip
                      key={option.id || option.name}
                    label={option.name}
                      {...chipProps}
                    size="small"
                    sx={{
                      backgroundColor: '#e3f2fd',
                      color: '#1976d2',
                        fontSize: '0.75rem',
                        height: '24px',
                      '& .MuiChip-deleteIcon': {
                          color: '#1976d2',
                          fontSize: '16px'
                      }
                    }}
                  />
                  );
                })
              }
            />
          </Grid>
          <Grid item xs="auto">
            <IconButton
              onClick={() => onDelete(activity.id)}
              color="error"
              size="small"
              sx={{ minWidth: '32px' }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

// Weather Forecast Component
const WeatherForecast = ({ startDate, endDate, location }) => {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!startDate || !endDate) {
      return;
    }

    const fetchWeatherData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // For demo purposes, we'll create mock weather data based on the screenshot
        // In a real implementation, you would call a weather API like OpenWeatherMap
        const start = new Date(startDate);
        const end = new Date(endDate);
        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
        
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
      } catch (err) {
        setError('Failed to fetch weather data');
      } finally {
        setLoading(false);
      }
    };

    fetchWeatherData();
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
      <Box sx={{ mt: 6, p: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>Loading weather forecast...</Typography>
      </Box>
    );
  }

  if (error || !weatherData) {
    return null; // Don't show anything if there's an error or no data
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
        {/* Weather Icon SVG - Thermometer */}
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
          <path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/>
          <path d="M12 2v2"/>
          <path d="M12 18v2"/>
          <path d="M8 14v4"/>
          <path d="M16 14v4"/>
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

const Outing = () => {
  const [tabValue, setTabValue] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [loading, setLoading] = useState(false);
  const previewRef = useRef();
  const [outingListExpanded, setOutingListExpanded] = useState(true);
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);

  // Form state
  const [outingData, setOutingData] = useState({
    eventName: '',
    startDateTime: null,
    endDateTime: null,
    startPoint: '',
    destination: '',
    mapLink: '',
    sics: [], // Senior in Charge (Scouts)
    aics: [], // Adult in Charge
    overview: '',
    detail: '',
    scheduleDays: [], // Will be auto-generated when dates are set
    parking: '',
    packingList: '',
    nearbyHospital: '',
    references: '',
    contacts: '',
    notes: '',
    attachments: [],
    images: [], // Uploaded images
    coverImage: 'forest', // Background image for hero section
    isPublic: true // Visibility setting
  });

  // Real data from Firebase
  const [existingOutings, setExistingOutings] = useState([]);
  const [loadingOutings, setLoadingOutings] = useState(true);
  const [currentOutingId, setCurrentOutingId] = useState(null); // Track if editing existing outing
  
  // Table state
  const [searchQuery, setSearchQuery] = useState('');
  const [startDateFilter, setStartDateFilter] = useState(null);
  const [endDateFilter, setEndDateFilter] = useState(null);
  const [displayedOutings, setDisplayedOutings] = useState(10); // For infinite scroll
  const [hasMoreOutings, setHasMoreOutings] = useState(true);


  // Real user data from database
  const [scouts, setScouts] = useState([]);
  const [adults, setAdults] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Load outings and users from Firebase on component mount
  useEffect(() => {
    loadOutings();
    loadUsers();
  }, []);

  // Load users from database and filter by roles
  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      console.log('Loading users from database...');
      const allUsers = await authService.getAllUsers();
      console.log('All users loaded:', allUsers);
      
      // Filter scouts (users with 'scout' role)
      const scoutUsers = allUsers.filter(user => 
        user.roles && user.roles.includes('scout') && user.accessStatus === 'approved'
      ).map(user => ({
        id: user.id,
        name: user.displayName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        rank: user.scoutRank || user.rank || 'Scout', // Use scoutRank field or fallback
        email: user.email
      }));
      
      // Filter adults (users with 'parent', 'leader', or 'admin' roles)
      const adultUsers = allUsers.filter(user => 
        user.roles && (
          user.roles.includes('parent') || 
          user.roles.includes('leader') || 
          user.roles.includes('admin')
        ) && user.accessStatus === 'approved'
      ).map(user => ({
        id: user.id,
        name: user.displayName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        role: user.scoutingRole || user.relation || 'Parent/Leader', // Use scoutingRole or relation
        email: user.email
      }));
      
      console.log('Filtered scouts:', scoutUsers);
      console.log('Filtered adults:', adultUsers);
      
      setScouts(scoutUsers);
      setAdults(adultUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      setSnackbar({
        open: true,
        message: 'Error loading users. Please try again.',
        severity: 'error'
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadOutings = async () => {
    try {
      setLoadingOutings(true);
      const outings = await outingService.getAllOutings();
      // Process the outings to convert Firestore timestamps to Date objects
      const processedOutings = outings.map(outing => outingService.processOutingData(outing));
      setExistingOutings(processedOutings);
    } catch (error) {
      console.error('Error loading outings:', error);
      setSnackbar({
        open: true,
        message: 'Error loading outings. Please try again.',
        severity: 'error'
      });
    } finally {
      setLoadingOutings(false);
    }
  };

  // Filter and search outings
  const filteredOutings = existingOutings.filter(outing => {
    // Show all outings (both public and private)
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const searchableText = [
        outing.eventName,
        outing.destination,
        outing.startPoint,
        outing.overview?.replace(/<[^>]*>/g, ''), // Strip HTML tags for search
        outing.sics?.map(sic => sic.name).join(' '),
        outing.aics?.map(aic => aic.name).join(' ')
      ].join(' ').toLowerCase();
      
      if (!searchableText.includes(query)) return false;
    }
    
    // Apply date range filter
    if (startDateFilter && outing.startDateTime) {
      const outingStart = new Date(outing.startDateTime);
      if (outingStart < startDateFilter) return false;
    }
    
    if (endDateFilter && outing.startDateTime) {
      const outingStart = new Date(outing.startDateTime);
      if (outingStart > endDateFilter) return false;
    }
    
    return true;
  });

  // Sort by start date descending (newest first)
  const sortedOutings = [...filteredOutings].sort((a, b) => {
    const dateA = new Date(a.startDateTime || 0);
    const dateB = new Date(b.startDateTime || 0);
    return dateB - dateA;
  });

  // Apply pagination for infinite scroll
  const displayedOutingsList = sortedOutings.slice(0, displayedOutings);
  
  // Update hasMoreOutings based on available data
  useEffect(() => {
    setHasMoreOutings(displayedOutings < sortedOutings.length);
  }, [displayedOutings, sortedOutings.length]);

  const loadOutingForEdit = (outing) => {
    setCurrentOutingId(outing.id); // Set the ID for editing
    
    // Convert old schedule format to new scheduleDays format if needed
    let scheduleDays = outing.scheduleDays;
    if (!scheduleDays && outing.schedule) {
      // Convert old format to new format
      scheduleDays = [{
        id: 'day-1',
        title: 'Day 1',
        activities: outing.schedule.map((item, index) => ({
          id: `activity-${index + 1}`,
          time: item.time || '',
          activity: item.activity || '',
          lead: '' // No lead field in old format
        }))
      }];
    } else if (!scheduleDays) {
      // Default structure
      scheduleDays = [{
        id: 'day-1',
        title: 'Day 1',
        activities: [{ id: 'activity-1', time: '', activity: '', lead: '', location: '' }]
      }];
    }
    
    // Convert SICs and AICs to proper format for autocomplete
    const formatSICs = (sics) => {
      if (!sics || !Array.isArray(sics)) return [];
      return sics.map(sic => {
        if (typeof sic === 'string') {
          // Find matching scout from database
          const scout = scouts.find(s => s.name === sic);
          return scout || { name: sic, role: 'Scout' };
        }
        return sic;
      });
    };
    
    const formatAICs = (aics) => {
      if (!aics || !Array.isArray(aics)) return [];
      return aics.map(aic => {
        if (typeof aic === 'string') {
          // Find matching adult from database
          const adult = adults.find(a => a.name === aic);
          return adult || { name: aic, role: 'Parent/Leader' };
        }
        return aic;
      });
    };
    
    setOutingData({
      eventName: outing.eventName,
      startDateTime: outing.startDateTime,
      endDateTime: outing.endDateTime,
      startPoint: outing.startPoint || '',
      destination: outing.destination,
      mapLink: outing.mapLink || '',
      sics: formatSICs(outing.sics),
      aics: formatAICs(outing.aics),
      overview: cleanHtmlContent(outing.overview) || '',
      detail: cleanHtmlContent(outing.detail) || '',
      scheduleDays: scheduleDays,
      parking: cleanHtmlContent(outing.parking) || '',
      packingList: cleanHtmlContent(outing.packingList) || '',
      nearbyHospital: cleanHtmlContent(outing.nearbyHospital) || '',
      references: cleanHtmlContent(outing.references) || '',
      contacts: cleanHtmlContent(outing.contacts) || '',
      notes: cleanHtmlContent(outing.notes) || '',
      attachments: outing.attachments || [],
      images: outing.images || [],
      coverImage: outing.coverImage || 'forest', // Add coverImage field
      isPublic: outing.isPublic
    });
    setTabValue(0); // Switch to edit tab
  };

  const createNewOuting = () => {
    setCurrentOutingId(null); // Clear the ID for new outing
    setOutingData({
      eventName: '',
      startDateTime: null,
      endDateTime: null,
      startPoint: '',
      destination: '',
      mapLink: '',
      sics: [],
      aics: [],
      overview: '',
      detail: '',
      scheduleDays: [], // Will be auto-generated when dates are set
      parking: '',
      packingList: '',
      nearbyHospital: '',
      references: '',
      contacts: '',
      notes: '',
      attachments: [],
      images: [],
      coverImage: 'forest', // Default cover image
      isPublic: true
    });
    setTabValue(0); // Switch to edit tab
  };

  // Simple HTML cleanup for Tiptap (much cleaner than ReactQuill)
  const cleanHtmlContent = (html) => {
    if (!html || html.trim() === '') return html;
    return html.trim();
  };

  const handleInputChange = (field, value) => {
    setOutingData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle Tiptap blur event (minimal processing needed)
  const handleRichTextBlur = (field, value) => {
    const cleanedValue = cleanHtmlContent(value);
    if (cleanedValue !== value) {
      setOutingData(prev => ({
        ...prev,
        [field]: cleanedValue
      }));
    }
  };

  // Handle date changes and auto-generate schedule days
  const handleDateChange = (field, value) => {
    setOutingData(prev => {
      const updated = {
        ...prev,
        [field]: value
      };

      // Auto-generate schedule days when both dates are set
      if (field === 'startDateTime' || field === 'endDateTime') {
        const startDate = field === 'startDateTime' ? value : prev.startDateTime;
        const endDate = field === 'endDateTime' ? value : prev.endDateTime;

        if (startDate && endDate && startDate instanceof Date && endDate instanceof Date && 
            !isNaN(startDate.getTime()) && !isNaN(endDate.getTime()) && startDate <= endDate) {
          
          // Calculate number of days (inclusive of start and end dates)
          const timeDiff = endDate.getTime() - startDate.getTime();
          const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24)) + 1; // +1 to include both start and end dates
          
          // Generate schedule days
          const newScheduleDays = [];
          for (let i = 0; i < daysDiff; i++) {
            newScheduleDays.push({
              id: `day-${i + 1}`,
              title: `Day ${i + 1}`,
              activities: []
            });
          }
          
          updated.scheduleDays = newScheduleDays;
          console.log(`Auto-generated ${daysDiff} schedule days for outing`);
        }
      }

      return updated;
    });
  };

  const loadMoreOutings = () => {
    if (hasMoreOutings) {
      setDisplayedOutings(prev => prev + 10);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStartDateFilter(null);
    setEndDateFilter(null);
    setDisplayedOutings(10);
  };

  const formatDateForTable = (date) => {
    if (!date) return 'Not set';
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      if (isNaN(dateObj.getTime())) return 'Invalid date';
      return dateObj.toLocaleDateString();
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Default images for when no images are uploaded
  const getDefaultImages = () => [
    {
      id: 'default1',
      name: 'Scout Adventure',
      url: 'https://images.unsplash.com/photo-1551632811-561732d1e306?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
      isDefault: true
    },
    {
      id: 'default2', 
      name: 'Outdoor Camping',
      url: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
      isDefault: true
    },
    {
      id: 'default3',
      name: 'Mountain Adventure',
      url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
      isDefault: true
    }
  ];

  const getDisplayImages = () => {
    return outingData.images.length > 0 ? outingData.images : getDefaultImages();
  };

  // Schedule management functions

  const addActivity = (dayId) => {
    const newActivityId = `activity-${Date.now()}`;
    const newActivity = {
      id: newActivityId,
      time: '',
      activity: '',
      lead: [], // Initialize as empty array for multiple leads
      location: ''
    };
    
    setOutingData(prev => ({
      ...prev,
      scheduleDays: prev.scheduleDays.map(day => 
        day.id === dayId 
          ? { ...day, activities: [...day.activities, newActivity] }
          : day
      )
    }));
  };

  const updateActivity = (dayId, updatedActivity) => {
    setOutingData(prev => ({
      ...prev,
      scheduleDays: prev.scheduleDays.map(day => 
        day.id === dayId 
          ? { 
              ...day, 
              activities: day.activities.map(activity => 
                activity.id === updatedActivity.id ? updatedActivity : activity
              )
            }
          : day
      )
    }));
  };

  const deleteActivity = (dayId, activityId) => {
    setOutingData(prev => ({
      ...prev,
      scheduleDays: prev.scheduleDays.map(day => 
        day.id === dayId 
          ? { ...day, activities: day.activities.filter(activity => activity.id !== activityId) }
          : day
      )
    }));
  };

  const deleteDay = (dayId) => {
    setOutingData(prev => ({
      ...prev,
      scheduleDays: prev.scheduleDays.filter(day => day.id !== dayId)
    }));
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    // Find the source day and activity
    let sourceDayId = null;
    let sourceActivityIndex = -1;
    let sourceActivity = null;

    for (const day of outingData.scheduleDays) {
      const activityIndex = day.activities.findIndex(activity => activity.id === activeId);
      if (activityIndex !== -1) {
        sourceDayId = day.id;
        sourceActivityIndex = activityIndex;
        sourceActivity = day.activities[activityIndex];
        break;
      }
    }

    if (!sourceActivity) return;

    // Find the target day and position
    let targetDayId = null;
    let targetActivityIndex = -1;

    for (const day of outingData.scheduleDays) {
      const activityIndex = day.activities.findIndex(activity => activity.id === overId);
      if (activityIndex !== -1) {
        targetDayId = day.id;
        targetActivityIndex = activityIndex;
        break;
      }
    }

    if (!targetDayId) return;

    setOutingData(prev => {
      const newScheduleDays = [...prev.scheduleDays];

      // Remove from source
      const sourceDayIndex = newScheduleDays.findIndex(day => day.id === sourceDayId);
      newScheduleDays[sourceDayIndex].activities.splice(sourceActivityIndex, 1);

      // Add to target
      const targetDayIndex = newScheduleDays.findIndex(day => day.id === targetDayId);
      if (sourceDayId === targetDayId) {
        // Same day reordering
        const adjustedTargetIndex = targetActivityIndex > sourceActivityIndex ? targetActivityIndex - 1 : targetActivityIndex;
        newScheduleDays[targetDayIndex].activities.splice(adjustedTargetIndex, 0, sourceActivity);
      } else {
        // Different day
        newScheduleDays[targetDayIndex].activities.splice(targetActivityIndex, 0, sourceActivity);
      }

      return {
        ...prev,
        scheduleDays: newScheduleDays
      };
    });
  };




  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Clean HTML content before saving (Tiptap generates much cleaner HTML)
      const cleanedOutingData = {
        ...outingData,
        overview: cleanHtmlContent(outingData.overview),
        detail: cleanHtmlContent(outingData.detail),
        packingList: cleanHtmlContent(outingData.packingList),
        parking: cleanHtmlContent(outingData.parking),
        nearbyHospital: cleanHtmlContent(outingData.nearbyHospital),
        notes: cleanHtmlContent(outingData.notes),
        contacts: cleanHtmlContent(outingData.contacts),
        references: cleanHtmlContent(outingData.references)
      };

      if (currentOutingId) {
        // Update existing outing
        await outingService.updateOuting(currentOutingId, cleanedOutingData);
        setSnackbar({
          open: true,
          message: 'Outing plan updated successfully!',
          severity: 'success'
        });
      } else {
        // Create new outing
        const newOutingId = await outingService.createOuting(cleanedOutingData);
        setCurrentOutingId(newOutingId);
        setSnackbar({
          open: true,
          message: 'Outing plan saved successfully!',
          severity: 'success'
        });
      }
      
      // Reload the outings list to reflect changes
      await loadOutings();
      
      // Switch to preview tab
      setTabValue(1);
    } catch (error) {
      console.error('Error saving outing:', error);
      setSnackbar({
        open: true,
        message: 'Error saving outing plan. Please try again.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };


  const formatDateTime = (dateTime) => {
    if (!dateTime) return 'Not specified';
    try {
      // Handle Date objects from MUI DateTimePicker
      const date = dateTime instanceof Date ? dateTime : new Date(dateTime);
      if (isNaN(date.getTime())) return 'Invalid date';
      return date.toLocaleString();
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Form validation function
  const isFormValid = () => {
    // Check required fields
    const requiredFields = [
      outingData.eventName?.trim(),
      outingData.startDateTime,
      outingData.endDateTime,
      outingData.overview?.trim(),
      outingData.detail?.trim(),
      outingData.packingList?.trim(),
      outingData.parking?.trim(), // Transportation
      outingData.nearbyHospital?.trim(), // Emergency Plan
    ];

    // Check if all required fields have values
    const allFieldsFilled = requiredFields.every(field => {
      if (field instanceof Date) {
        return !isNaN(field.getTime());
      }
      return field && field !== '';
    });

    // Check if schedule has at least one day with activities
    const hasSchedule = outingData.scheduleDays && 
      outingData.scheduleDays.length > 0 && 
      outingData.scheduleDays.some(day => 
        day.activities && day.activities.length > 0 && 
        day.activities.some(activity => 
          activity.activity && activity.activity.trim() !== ''
        )
      );

    return allFieldsFilled && hasSchedule;
  };

  // Generate date for a specific day based on start date
  const generateDayDate = (dayIndex) => {
    if (!outingData.startDateTime) {
      return '';
    }
    
    try {
      const startDate = new Date(outingData.startDateTime);
      // Reset time to avoid timezone issues with date-only operations
      startDate.setHours(0, 0, 0, 0);
      const dayDate = new Date(startDate);
      dayDate.setDate(startDate.getDate() + dayIndex);
      
      return dayDate.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: '2-digit'
      });
    } catch (error) {
      return '';
    }
  };

  // Highlight search terms in text
  const highlightText = (text, searchQuery) => {
    if (!searchQuery || !text) return text;
    
    const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <Box
          component="span"
          key={index}
          sx={{
            backgroundColor: '#ffeb3b',
            color: '#000',
            fontWeight: 'bold'
          }}
        >
          {part}
        </Box>
      ) : part
    );
  };

  const groupScheduleByDate = () => {
    if (!outingData.scheduleDays || !Array.isArray(outingData.scheduleDays)) {
      return {};
    }
    
    const grouped = {};
    outingData.scheduleDays.forEach(day => {
      if (day.activities && Array.isArray(day.activities)) {
        day.activities.forEach(activity => {
          const dayTitle = day.title || 'Day';
          if (!grouped[dayTitle]) {
            grouped[dayTitle] = [];
          }
          // Handle lead field - convert array to string for display
          const leadDisplay = Array.isArray(activity.lead) 
            ? activity.lead.map(lead => lead.name || lead).join(', ')
            : activity.lead || '';

          grouped[dayTitle].push({
            time: activity.time,
            activity: activity.activity,
            lead: leadDisplay,
            location: activity.location || '',
            group: 'All' // Default group for compatibility
          });
        });
      }
    });
    return grouped;
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        <PageTitle 
          title="Outing Management" 
          description="Plan and organize scout outings with detailed itineraries"
          icon={ScheduleIcon}
        />

        {/* Outing Packets Table */}
        <Accordion 
          expanded={outingListExpanded} 
          onChange={() => setOutingListExpanded(!outingListExpanded)}
          sx={{ mt: 3, mb: 2 }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <EventIcon sx={{ mr: 2, color: 'primary.main' }} />
              <Typography variant="h6" sx={{ flexGrow: 1 }}>
                Outing Packets ({sortedOutings.length})
              </Typography>
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                onClick={(e) => {
                  e.stopPropagation();
                  createNewOuting();
                }}
                sx={{ mr: 2 }}
              >
                New Outing
              </Button>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            {/* Search and Filter Controls */}
            <Box sx={{ mb: 3 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    placeholder="Search outings..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={2.5}>
                  <DateTimePicker
                    label="Start"
                    value={startDateFilter}
                    onChange={(value) => setStartDateFilter(value)}
                    views={['year', 'month', 'day']}
                    renderInput={(params) => <TextField {...params} fullWidth size="small" />}
                  />
                </Grid>
                <Grid item xs={12} md={2.5}>
                  <DateTimePicker
                    label="End"
                    value={endDateFilter}
                    onChange={(value) => setEndDateFilter(value)}
                    views={['year', 'month', 'day']}
                    renderInput={(params) => <TextField {...params} fullWidth size="small" />}
                  />
                </Grid>
                <Grid item xs={12} md={1}>
                  <Button
                    variant="outlined"
                    startIcon={<FilterIcon />}
                    onClick={clearFilters}
                    fullWidth
                  >
                    Clear
                  </Button>
                </Grid>
              </Grid>
            </Box>

            {/* Outing Table */}
            {loadingOutings ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress />
              </Box>
            ) : displayedOutingsList.length === 0 ? (
              <Typography color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                {searchQuery || startDateFilter || endDateFilter 
                  ? 'No outings match your search criteria.' 
                  : 'No outings available. Create your first outing!'
                }
              </Typography>
            ) : (
              <>
                <TableContainer component={Paper} sx={{ maxHeight: 600, overflow: 'auto' }}>
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Visibility</strong></TableCell>
                        <TableCell><strong>Outing Name</strong></TableCell>
                        <TableCell><strong>Start</strong></TableCell>
                        <TableCell><strong>End</strong></TableCell>
                        <TableCell><strong>Location</strong></TableCell>
                        <TableCell><strong>SICs</strong></TableCell>
                        <TableCell><strong>AICs</strong></TableCell>
                        <TableCell><strong>Actions</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {displayedOutingsList.map((outing) => (
                        <TableRow key={outing.id} hover>
                          <TableCell>
                            <Chip 
                              icon={outing.isPublic ? <VisibilityIcon /> : <VisibilityOffIcon />} 
                              label={outing.isPublic ? "Public" : "Private"} 
                              size="small" 
                              color={outing.isPublic ? "success" : "error"} 
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {highlightText(outing.eventName, searchQuery)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {formatDateForTable(outing.startDateTime)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {formatDateForTable(outing.endDateTime)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {outing.destination ? (
                              <Link
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(outing.destination)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                sx={{ 
                                  color: 'primary.main',
                                  textDecoration: 'none',
                                  '&:hover': {
                                    textDecoration: 'underline'
                                  }
                                }}
                              >
                                <Typography variant="body2">
                                  {highlightText(outing.destination, searchQuery)}
                                </Typography>
                              </Link>
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                Not specified
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {outing.sics?.length > 0 
                                ? highlightText(outing.sics.map(sic => sic.name).join(', '), searchQuery)
                                : 'None assigned'
                              }
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {outing.aics?.length > 0 
                                ? highlightText(outing.aics.map(aic => aic.name).join(', '), searchQuery)
                                : 'None assigned'
                              }
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Tooltip title="Edit this outing">
                                <IconButton 
                                  size="small"
                                  onClick={() => loadOutingForEdit(outing)}
                                  color="primary"
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Load More Button for Infinite Scroll */}
                {hasMoreOutings && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                    <Button
                      variant="outlined"
                      onClick={loadMoreOutings}
                      disabled={loadingOutings}
                    >
                      Load More Outings ({sortedOutings.length - displayedOutings} remaining)
                    </Button>
                  </Box>
                )}
              </>
            )}
          </AccordionDetails>
        </Accordion>

        <Paper sx={{ mt: 3 }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab 
              icon={<EditIcon />} 
              label="Edit" 
              iconPosition="start"
            />
            <Tab 
              icon={<PreviewIcon />} 
              label="Preview" 
              iconPosition="start"
            />
          </Tabs>

          {/* Edit Tab */}
          <TabPanel value={tabValue} index={0}>
            <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
              {/* Header with Visibility Toggle */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                pb: 4
              }}>
                <Typography variant="h5" sx={{ fontWeight: 600, color: '#1976d2' }}>
                  Basic Information
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    {outingData.isPublic ? 'Public' : 'Private'}
                  </Typography>
                  <Switch
                    checked={outingData.isPublic}
                    onChange={(e) => handleInputChange('isPublic', e.target.checked)}
                    color="primary"
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ minWidth: 120 }}>
                    {outingData.isPublic ? '(Visible to everyone)' : '(SICs & AICs only)'}
                  </Typography>
                </Box>
              </Box>

              {/* Form Fields */}
              <Grid container spacing={3}>
                {/* Row 1: Event Name (2 columns), Start Date (1 column), End Date (1 column) */}
                <Grid item xs={12} sm={6} md={6}>
                  <TextField
                    fullWidth
                    label="Event Name"
                    value={outingData.eventName}
                    onChange={(e) => handleInputChange('eventName', e.target.value)}
                    required
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      }
                    }}
                  />
                </Grid>

                <Grid item xs={6} sm={3} md={3}>
                  <DatePicker
                    label="Start Date *"
                    value={outingData.startDateTime}
                    onChange={(value) => handleDateChange('startDateTime', value)}
                    renderInput={(params) => (
                      <TextField 
                        {...params} 
                        fullWidth 
                        required
                        variant="outlined"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                          }
                        }}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={6} sm={3} md={3}>
                  <DatePicker
                    label="End Date *"
                    value={outingData.endDateTime}
                    onChange={(value) => handleDateChange('endDateTime', value)}
                    renderInput={(params) => (
                      <TextField 
                        {...params} 
                        fullWidth 
                        required
                        variant="outlined"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                          }
                        }}
                      />
                    )}
                  />
                </Grid>

                {/* Row 2: Departure Location (2 columns), Destination (2 columns) */}
                <Grid item xs={12} sm={6} md={6}>
                  <TextField
                    fullWidth
                    label="Departure Location Address"
                    value={outingData.startPoint}
                    onChange={(e) => handleInputChange('startPoint', e.target.value)}
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      }
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={6}>
                  <TextField
                    fullWidth
                    label="Destination Address"
                    value={outingData.destination}
                    onChange={(e) => handleInputChange('destination', e.target.value)}
                    required
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      }
                    }}
                  />
                </Grid>

                {/* Row 3: Map Embed Code (4 columns & 2 rows height) */}
                <Grid item xs={12}>
                  <Box>
                  <TextField
                    fullWidth
                    multiline
                    rows={8}
                    label="Map Embed Code"
                    value={outingData.mapLink}
                    onChange={(e) => handleInputChange('mapLink', e.target.value)}
                    required
                    placeholder="Paste Google Maps embed code here"
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      }
                    }}
                  />
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <IconButton 
                        size="small" 
                        onClick={() => setHelpDialogOpen(true)}
                        sx={{ mr: 1, p: 0.5 }}
                      >
                        <InfoIcon sx={{ fontSize: 16, color: '#666' }} />
                      </IconButton>
                      <Typography variant="caption" sx={{ color: '#666' }}>
                        Go to{' '}
                        <Link 
                          href="https://maps.google.com" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          sx={{ color: '#1976d2', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                        >
                          Google Maps
                        </Link>
                        {' '}→ Search location → Share → Embed a map → Copy the full &lt;iframe&gt; code
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                {/* Cover Background Image Picker */}
                <Grid item xs={12}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, color: '#333' }}>
                      Cover Background Image
                    </Typography>
                    <Box sx={{ 
                      display: 'flex', 
                      gap: 2, 
                      flexWrap: 'wrap',
                      justifyContent: { xs: 'center', sm: 'flex-start' }
                    }}>
                      {[
                        { id: 'biking', name: 'Biking', url: 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60' },
                        { id: 'snow', name: 'Snow', url: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60' },
                        { id: 'hike', name: 'Hike', url: 'https://images.unsplash.com/photo-1533873984035-25970ab07461?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60' },
                        { id: 'mountain', name: 'Mountain', url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60' },
                        { id: 'rafting', name: 'Rafting', url: 'https://plus.unsplash.com/premium_photo-1661891887710-0528c1d76b92?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60' },
                        { id: 'sea', name: 'Sea', url: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60' },
                        { id: 'camp', name: 'Camp', url: 'https://images.unsplash.com/photo-1504851149312-7a075b496cc7?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60' },
                        { id: 'backpack', name: 'Backpack', url: 'https://images.unsplash.com/photo-1551632811-561732d1e306?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60' },
                        { id: 'forest', name: 'Forest', url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60' },
                        { id: 'canyon', name: 'Canyon', url: 'https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60' },
                        { id: 'tropical', name: 'Tropical', url: 'https://images.unsplash.com/photo-1509233725247-49e657c54213?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60' },
                        { id: 'bridge', name: 'Bridge', url: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60' },
                        { id: 'beach', name: 'Beach', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60' },
                        { id: 'trail', name: 'Trail', url: 'https://images.unsplash.com/photo-1445308394109-4ec2920981b1?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60' },
                        { id: 'city', name: 'City', url: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60' },
                        { id: 'sport', name: 'Sport', url: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60' }
                      ].map((image) => (
                        <Box
                          key={image.id}
                          onClick={() => handleInputChange('coverImage', image.id)}
                          sx={{
                            width: 120,
                            height: 80,
                            borderRadius: 2,
                            overflow: 'hidden',
                            cursor: 'pointer',
                            border: outingData.coverImage === image.id ? '3px solid #1976d2' : '2px solid #e0e0e0',
                            transition: 'all 0.2s ease',
                            position: 'relative',
                            backgroundImage: `url(${image.url})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            '&:hover': {
                              border: '3px solid #1976d2',
                              transform: 'scale(1.02)'
                            }
                          }}
                        >
                          <Box sx={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            backgroundColor: 'rgba(0,0,0,0.7)',
                            color: 'white',
                            padding: '4px 8px',
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            textAlign: 'center'
                          }}>
                            {image.name}
                          </Box>
                          {outingData.coverImage === image.id && (
                            <Box sx={{
                              position: 'absolute',
                              top: 4,
                              right: 4,
                              backgroundColor: '#1976d2',
                              borderRadius: '50%',
                              width: 20,
                              height: 20,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                              </svg>
                            </Box>
                          )}
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </Grid>
              </Grid>

              {/* Leadership Section */}
              <Box sx={{ mt: 6, mb: 4 }}>
                <Typography variant="h5" sx={{ fontWeight: 600, color: '#1976d2', mb: 3 }}>
                  <PeopleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Scout In Charge
                </Typography>
                <Box sx={{ 
                  p: 3,
                  backgroundColor: '#f8f9fa',
                  borderRadius: 2,
                  border: '1px solid #e0e0e0'
                }}>
                  <Autocomplete
                    multiple
                    options={scouts}
                    getOptionLabel={(option) => `${option.name} (${option.rank})`}
                    value={outingData.sics}
                    onChange={(event, newValue) => {
                      setOutingData(prev => ({
                        ...prev,
                        sics: newValue.map(scout => ({ name: scout.name, role: scout.rank }))
                      }));
                    }}
                    isOptionEqualToValue={(option, value) => 
                      option.name === value.name && option.rank === value.role
                    }
                    loading={loadingUsers}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Select Scouts in Charge (SICs)"
                        placeholder={loadingUsers ? "Loading scouts..." : "Type to search scouts..."}
                        required
                        variant="outlined"
                        sx={{ borderRadius: 2 }}
                        helperText={scouts.length === 0 && !loadingUsers ? "No scouts found. Please ensure users are registered with 'scout' role." : ""}
                      />
                    )}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => {
                        const { key, ...chipProps } = getTagProps({ index });
                        return (
                        <Chip
                            key={option.id || option.name || index}
                          label={`${option.name} (${option.role})`}
                            {...chipProps}
                          color="primary"
                          variant="filled"
                          sx={{ 
                            height: 40,
                              fontSize: '1.0rem',
                            '& .MuiChip-deleteIcon': {
                              fontSize: '1.1rem'
                            }
                          }}
                        />
                        );
                      })
                    }
                    sx={{ mb: 2 }}
                  />
                </Box>
              </Box>

              {/* Adult in Charge Section */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="h5" sx={{ fontWeight: 600, color: '#1976d2', mb: 3 }}>
                  <PeopleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Adult In Charge
                </Typography>
                <Box sx={{ 
                  p: 3,
                  backgroundColor: '#f8f9fa',
                  borderRadius: 2,
                  border: '1px solid #e0e0e0'
                }}>
                  <Autocomplete
                    multiple
                    options={adults}
                    getOptionLabel={(option) => `${option.name} (${option.role})`}
                    value={outingData.aics}
                    onChange={(event, newValue) => {
                      setOutingData(prev => ({
                        ...prev,
                        aics: newValue.map(adult => ({ name: adult.name, role: adult.role }))
                      }));
                    }}
                    isOptionEqualToValue={(option, value) => 
                      option.name === value.name && option.role === value.role
                    }
                    loading={loadingUsers}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Select Adults in Charge (AICs)"
                        placeholder={loadingUsers ? "Loading adults..." : "Type to search adults/parents..."}
                        required
                        variant="outlined"
                        sx={{ borderRadius: 2 }}
                        helperText={adults.length === 0 && !loadingUsers ? "No adults found. Please ensure users are registered with 'parent', 'leader', or 'admin' role." : ""}
                      />
                    )}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => {
                        const { key, ...chipProps } = getTagProps({ index });
                        return (
                        <Chip
                            key={option.id || option.name || index}
                          label={`${option.name} (${option.role})`}
                            {...chipProps}
                          color="success"
                          variant="filled"
                          sx={{ 
                            height: 40,
                              fontSize: '1.0rem',
                            '& .MuiChip-deleteIcon': {
                              fontSize: '1.1rem'
                            }
                          }}
                        />
                        );
                      })
                    }
                    sx={{ mb: 2 }}
                  />
                </Box>
              </Box>

              {/* Overview Section */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="h5" sx={{ fontWeight: 600, color: '#1976d2', mb: 3 }}>
                  <DescriptionIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Overview *
                </Typography>
                <Box sx={{ 
                  border: '1px solid #e0e0e0', 
                  borderRadius: 2
                }}>
                  <TiptapEditor
                    value={outingData.overview}
                    onChange={(value) => handleInputChange('overview', value)}
                    onBlur={(value) => handleRichTextBlur('overview', value)}
                    placeholder="Describe the purpose and goals of this outing..."
                    minHeight="150px"
                  />
                </Box>
              </Box>

              {/* Detail Section */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="h5" sx={{ fontWeight: 600, color: '#1976d2', mb: 3 }}>
                  <AssignmentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Detail *
                </Typography>
                <Box sx={{ 
                  border: '1px solid #e0e0e0', 
                  borderRadius: 2
                }}>
                  <TiptapEditor
                    value={outingData.detail}
                    onChange={(value) => handleInputChange('detail', value)}
                    onBlur={(value) => handleRichTextBlur('detail', value)}
                    placeholder="Provide detailed information about this outing..."
                    minHeight="150px"
                  />
                </Box>
              </Box>

              {/* Schedule Section */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="h5" sx={{ fontWeight: 600, color: '#1976d2', mb: 3 }}>
                  <ScheduleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Schedule *
                </Typography>
                
                <DndContext 
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <Box sx={{ 
                    backgroundColor: '#f8f9fa', 
                    borderRadius: 2, 
                    p: 3, 
                    border: '1px solid #e0e0e0' 
                  }}>
                    {!outingData.scheduleDays || outingData.scheduleDays.length === 0 ? (
                      <Box sx={{ 
                        p: 4, 
                        textAlign: 'center', 
                        color: 'text.secondary',
                        backgroundColor: 'white',
                        borderRadius: 2,
                        border: '2px dashed #e0e0e0'
                      }}>
                        <Typography variant="body1" sx={{ mb: 2 }}>
                          📅 Schedule days will be automatically generated
                        </Typography>
                        <Typography variant="body2">
                          Set both Start Date and End Date above to create day containers
                        </Typography>
                      </Box>
                    ) : (
                      (outingData.scheduleDays || []).map((day, dayIndex) => {
                      const dayDate = generateDayDate(dayIndex);
                      return (
                        <Box key={day.id} sx={{ 
                          backgroundColor: 'white',
                          borderRadius: 3,
                          border: '2px solid #d7e5f2',
                          overflow: 'hidden',
                          mb: 4
                        }}>
                          <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            px: 3,
                            py: '10px',
                            backgroundColor: '#d7e5f2',
                            color: '#2c3e50'
                          }}>
                            <Box>
                              <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                                {day.title}
                                {dayDate && (
                                  <Typography component="span" sx={{ ml: 1, opacity: 0.9, fontSize: '0.9em' }}>
                                    ({dayDate})
                                  </Typography>
                                )}
                              </Typography>
                            </Box>
                            <Box>
                              <Button
                                startIcon={<AddIcon />}
                                onClick={() => addActivity(day.id)}
                                variant="contained"
                                size="small"
                                sx={{ 
                                  mr: 1,
                                  backgroundColor: '#2c3e50',
                                  color: 'white',
                                  borderRadius: '5px',
                                  textTransform: 'none',
                                  padding: '5px 10px',
                                  '&:hover': {
                                    backgroundColor: '#34495e'
                                  }
                                }}
                              >
                                Add Activity
                              </Button>
                              {outingData.scheduleDays.length > 1 && (
                                <IconButton
                                  onClick={() => deleteDay(day.id)}
                                  size="small"
                                  sx={{ 
                                    color: '#2c3e50',
                                    '&:hover': {
                                      backgroundColor: 'rgba(44,62,80,0.1)'
                                    }
                                  }}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              )}
                            </Box>
                          </Box>
                          
                          <Box sx={{ p: 3 }}>
                            <SortableContext 
                              items={day.activities.map(activity => activity.id)}
                              strategy={verticalListSortingStrategy}
                            >
                              {day.activities.map((activity) => (
                                <SortableActivityItem
                                  key={activity.id}
                                  activity={activity}
                                  onUpdate={(updatedActivity) => updateActivity(day.id, updatedActivity)}
                                  onDelete={(activityId) => deleteActivity(day.id, activityId)}
                                  scouts={scouts}
                                />
                              ))}
                            </SortableContext>
                            
                            {day.activities.length === 0 && (
                              <Box sx={{ 
                                p: 4, 
                                textAlign: 'center', 
                                color: 'text.secondary',
                                backgroundColor: '#f9f9f9',
                                borderRadius: 2,
                                border: '2px dashed #e0e0e0'
                              }}>
                                <Typography variant="body2">
                                  No activities yet. Click "Add Activity" to get started.
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        </Box>
                      );
                    }))}
                    
                  </Box>
                </DndContext>
              </Box>

              {/* Additional Information Section */}
              {/* Packing List Section */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="h5" sx={{ fontWeight: 600, color: '#1976d2', mb: 3 }}>
                  <BackpackIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Packing List *
                </Typography>
                <Box sx={{ 
                  border: '1px solid #e0e0e0', 
                  borderRadius: 2
                }}>
                  <TiptapEditor
                    value={outingData.packingList}
                    onChange={(value) => handleInputChange('packingList', value)}
                    onBlur={(value) => handleRichTextBlur('packingList', value)}
                    placeholder="Items to bring, clothing recommendations, gear requirements..."
                    minHeight="120px"
                  />
                </Box>
              </Box>

              {/* Transportation Section */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="h5" sx={{ fontWeight: 600, color: '#1976d2', mb: 3 }}>
                  <DirectionsCarIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Transportation *
                </Typography>
                <Box sx={{ 
                  border: '1px solid #e0e0e0', 
                  borderRadius: 2
                }}>
                  <TiptapEditor
                  value={outingData.parking}
                    onChange={(value) => handleInputChange('parking', value)}
                    onBlur={(value) => handleRichTextBlur('parking', value)}
                    placeholder="Carpool arrangements, public transit options, parking information, driving directions..."
                    minHeight="120px"
                  />
                </Box>
              </Box>

              {/* Emergency Plan Section */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="h5" sx={{ fontWeight: 600, color: '#1976d2', mb: 3 }}>
                  <LocalHospitalIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Emergency Plan *
                </Typography>
                <Box sx={{ 
                  border: '1px solid #e0e0e0', 
                  borderRadius: 2
                }}>
                  <TiptapEditor
                  value={outingData.nearbyHospital}
                    onChange={(value) => handleInputChange('nearbyHospital', value)}
                    onBlur={(value) => handleRichTextBlur('nearbyHospital', value)}
                    placeholder="Emergency procedures, nearby hospitals, medical facilities..."
                    minHeight="120px"
                  />
                </Box>
              </Box>

              {/* Special Instructions Section */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="h5" sx={{ fontWeight: 600, color: '#1976d2', mb: 3 }}>
                  <NotificationImportantIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Special Instructions
                </Typography>
                <Box sx={{ 
                  border: '1px solid #e0e0e0', 
                  borderRadius: 2
                }}>
                  <TiptapEditor
                    value={outingData.notes}
                    onChange={(value) => handleInputChange('notes', value)}
                    onBlur={(value) => handleRichTextBlur('notes', value)}
                    placeholder="Special instructions, important notes, rules and regulations..."
                    minHeight="120px"
                  />
                </Box>
              </Box>

              {/* Additional Contacts Section */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="h5" sx={{ fontWeight: 600, color: '#1976d2', mb: 3 }}>
                  <ContactPhoneIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Additional Contacts
                </Typography>
                <Box sx={{ 
                  border: '1px solid #e0e0e0', 
                  borderRadius: 2
                }}>
                  <TiptapEditor
                  value={outingData.contacts}
                    onChange={(value) => handleInputChange('contacts', value)}
                    onBlur={(value) => handleRichTextBlur('contacts', value)}
                    placeholder="Emergency contacts, facility contacts, local authorities..."
                    minHeight="120px"
                  />
                </Box>
              </Box>

              {/* References Section */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="h5" sx={{ fontWeight: 600, color: '#1976d2', mb: 3 }}>
                  <MenuBookIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  References
                </Typography>
                <Box sx={{ 
                  border: '1px solid #e0e0e0', 
                  borderRadius: 2
                }}>
                  <TiptapEditor
                    value={outingData.references}
                    onChange={(value) => handleInputChange('references', value)}
                    onBlur={(value) => handleRichTextBlur('references', value)}
                    placeholder="Websites, guides, maps, or other helpful references..."
                    minHeight="120px"
                  />
                </Box>
              </Box>


              {/* Image Upload Section */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="h5" sx={{ fontWeight: 600, color: '#1976d2', mb: 3 }}>
                  <CameraAltIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Outing Images
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                  Upload photos to showcase your outing. These will be displayed in the preview template.
                </Typography>
                
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="image-upload"
                  multiple
                  type="file"
                  onChange={(e) => {
                    const files = Array.from(e.target.files);
                    files.forEach(file => {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        setOutingData(prev => ({
                          ...prev,
                          images: [...prev.images, {
                            id: Date.now() + Math.random(),
                            name: file.name,
                            url: event.target.result,
                            file: file
                          }]
                        }));
                      };
                      reader.readAsDataURL(file);
                    });
                  }}
                />
                <label htmlFor="image-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<AddIcon />}
                    sx={{ mb: 2 }}
                  >
                    Upload Images
                  </Button>
                </label>

                {/* Image Preview Grid */}
                {outingData.images.length > 0 && (
                  <Grid container spacing={2}>
                    {outingData.images.map((image) => (
                      <Grid item xs={12} sm={6} md={4} key={image.id}>
                        <Card sx={{ position: 'relative' }}>
                          <Box
                            component="img"
                            src={image.url}
                            alt={image.name}
                            sx={{
                              width: '100%',
                              height: 150,
                              objectFit: 'cover'
                            }}
                          />
                          <IconButton
                            sx={{
                              position: 'absolute',
                              top: 4,
                              right: 4,
                              backgroundColor: 'rgba(255,255,255,0.8)',
                              '&:hover': { backgroundColor: 'rgba(255,255,255,0.9)' }
                            }}
                            size="small"
                            onClick={() => {
                              setOutingData(prev => ({
                                ...prev,
                                images: prev.images.filter(img => img.id !== image.id)
                              }));
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                          <CardContent sx={{ p: 1 }}>
                            <Typography variant="caption" noWrap>
                              {image.name}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Box>

            </Box>

            {/* Sticky Submit Button */}
            <Box sx={{ 
              position: 'sticky',
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: 'white',
              borderTop: '1px solid #e0e0e0',
              boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
              p: 3,
              display: 'flex',
              justifyContent: 'center',
              zIndex: 1000
            }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleSubmit}
                disabled={loading || !isFormValid()}
                  sx={{ 
                  minWidth: 250,
                    height: 48,
                    borderRadius: 3,
                    backgroundColor: '#1976d2',
                  boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
                    '&:hover': {
                    backgroundColor: '#1565c0',
                    boxShadow: '0 6px 16px rgba(25, 118, 210, 0.4)'
                  },
                  '&:disabled': {
                    backgroundColor: '#ccc',
                    boxShadow: 'none'
                    }
                  }}
                >
                  {loading 
                    ? (currentOutingId ? 'Updating...' : 'Saving...') 
                  : !isFormValid()
                    ? 'Complete Required Fields to Save'
                    : (currentOutingId ? 'Update Outing Plan' : 'Save Outing Plan')
                  }
                </Button>
            </Box>
          </TabPanel>

          {/* Preview Tab */}
          <TabPanel value={tabValue} index={1}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mb: 2 }}>
              <Button
                variant="outlined"
                startIcon={<OpenInNewIcon />}
                onClick={() => {
                  const eventId = currentOutingId || 'preview';
                  const liveViewUrl = `/outing/${eventId}`;
                  window.open(liveViewUrl, '_blank', 'width=1200,height=800');
                }}
                sx={{ 
                  borderColor: '#1976d2',
                  color: '#1976d2',
                  px: 3,
                  py: 1.5,
                  borderRadius: 2,
                  '&:hover': {
                    backgroundColor: '#1976d2',
                    color: 'white',
                    transform: 'translateY(-1px)'
                  }
                }}
              >
                Live View
              </Button>
            </Box>

            {/* Use the reusable OutingPreview component */}
            <OutingPreview 
              outingData={outingData}
              showExportButton={true}
              isLiveView={false}
            />
          </TabPanel>
        </Paper>

        {/* Google Maps Help Dialog */}
        <Dialog
          open={helpDialogOpen}
          onClose={() => setHelpDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">How to Get Google Maps Embed Code</Typography>
            <IconButton onClick={() => setHelpDialogOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <Typography variant="body1" sx={{ mb: 3 }}>
              Follow these 3 simple steps to get the embed code from Google Maps:
            </Typography>
            
            {/* Step 1 */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <Box sx={{ 
                  backgroundColor: '#4CAF50', 
                  color: 'white', 
                  borderRadius: '50%', 
                  width: 24, 
                  height: 24, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  mr: 1,
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}>
                  1
                </Box>
                Search for your location
              </Typography>
              <Typography variant="body2" sx={{ mb: 2, color: '#666' }}>
                Go to Google Maps and search for your destination location.
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                mb: 2,
                border: '2px solid #e0e0e0',
                borderRadius: 2,
                overflow: 'hidden'
              }}>
                <img 
                  src="/assets/images/help/map-step-1.jpg" 
                  alt="Step 1: Search for your location in Google Maps"
                  style={{ 
                    width: '100%', 
                    maxWidth: '500px', 
                    height: 'auto',
                    display: 'block'
                  }}
                />
              </Box>
            </Box>

            {/* Step 2 */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <Box sx={{ 
                  backgroundColor: '#4CAF50', 
                  color: 'white', 
                  borderRadius: '50%', 
                  width: 24, 
                  height: 24, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  mr: 1,
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}>
                  2
                </Box>
                Click "Share or embed map"
              </Typography>
              <Typography variant="body2" sx={{ mb: 2, color: '#666' }}>
                In the left sidebar, click on "Share or embed map" option.
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                mb: 2,
                border: '2px solid #e0e0e0',
                borderRadius: 2,
                overflow: 'hidden'
              }}>
                <img 
                  src="/assets/images/help/map-step-2.jpg" 
                  alt="Step 2: Click Share or embed map in Google Maps"
                  style={{ 
                    width: '100%', 
                    maxWidth: '500px', 
                    height: 'auto',
                    display: 'block'
                  }}
                />
              </Box>
            </Box>

            {/* Step 3 */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <Box sx={{ 
                  backgroundColor: '#4CAF50', 
                  color: 'white', 
                  borderRadius: '50%', 
                  width: 24, 
                  height: 24, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  mr: 1,
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}>
                  3
                </Box>
                Copy the embed code
              </Typography>
              <Typography variant="body2" sx={{ mb: 2, color: '#666' }}>
                Click on "Embed a map" tab, then click "COPY HTML" to copy the full iframe code.
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                mb: 2,
                border: '2px solid #e0e0e0',
                borderRadius: 2,
                overflow: 'hidden'
              }}>
                <img 
                  src="/assets/images/help/map-step-3.jpg" 
                  alt="Step 3: Copy the embed code from Google Maps"
                  style={{ 
                    width: '100%', 
                    maxWidth: '500px', 
                    height: 'auto',
                    display: 'block'
                  }}
                />
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setHelpDialogOpen(false)} variant="contained">
              Got it!
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
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
    </LocalizationProvider>
  );
};

export default Outing;
