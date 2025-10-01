import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  FormControlLabel,
  Tooltip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Link,
  Autocomplete,
  useTheme,
  useMediaQuery
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
  PersonAdd as PersonAddIcon,
  PhotoLibrary as PhotoLibraryIcon,
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
  Room as RoomIcon,
  Warning as WarningIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  UnfoldMore as UnfoldMoreIcon,
  Help as HelpIcon
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
// import jsPDF from 'jspdf';
// import html2canvas from 'html2canvas';
import PageTitle from '../components/PageTitle';
import outingService from '../services/outingService';
import authService from '../services/authService';
import googleDriveService from '../services/googleDriveService';

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
      <CardContent sx={{ padding: '25px 10px 15px !important' }}>
        <Grid container spacing={1} alignItems="flex-start" sx={{ minHeight: '56px !important' }}>
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
              componentsProps={{
                popper: {
                  sx: {
                    '& .MuiAutocomplete-listbox': {
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      '& .MuiAutocomplete-option': {
                        color: 'white',
                        '&:hover': {
                          backgroundColor: 'rgba(76, 175, 80, 0.3)'
                        },
                        '&[aria-selected="true"]': {
                          backgroundColor: 'rgba(76, 175, 80, 0.5)'
                        }
                      }
                    },
                    '& .MuiPaper-root': {
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      backdropFilter: 'blur(10px)'
                    }
                  }
                }
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Time"
                  placeholder="9:00 AM"
                  variant="outlined"
                  size="small"
                  sx={{ 
                    borderRadius: 2,
                    '& .MuiInputBase-input': { 
                      fontSize: '0.875rem',
                      color: 'rgba(0, 0, 0, 0.87)'
                    },
                    '& .MuiInputLabel-root': {
                      color: '#4caf50 !important',
                      fontWeight: '600 !important',
                      fontSize: '0.9rem !important',
                      '&.Mui-focused': {
                        color: '#2e7d32 !important',
                        fontWeight: '700 !important'
                      }
                    },
                    '& .MuiOutlinedInput-root': {
                      minHeight: '40px',
                      height: '40px',
                      backgroundColor: 'rgba(255, 255, 255, 0.95) !important',
                      '& fieldset': {
                        borderColor: '#4caf50 !important',
                        borderWidth: '2px !important'
                      },
                      '&:hover fieldset': {
                        borderColor: '#2e7d32 !important',
                        borderWidth: '2px !important'
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#1b5e20 !important',
                        borderWidth: '3px !important'
                      }
                    },
                    '& .MuiOutlinedInput-input::placeholder': {
                      color: 'rgba(0, 0, 0, 0.6)',
                      opacity: 1
                    }
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
              required
              size="small"
              sx={{ 
                borderRadius: 2,
                '& .MuiInputBase-input': { 
                  fontSize: '0.875rem',
                  color: 'rgba(0, 0, 0, 0.87)'
                },
                '& .MuiInputLabel-root': {
                  color: '#4caf50 !important',
                  fontWeight: '600 !important',
                  fontSize: '0.9rem !important',
                  '&.Mui-focused': {
                    color: '#2e7d32 !important',
                    fontWeight: '700 !important'
                  }
                },
                '& .MuiOutlinedInput-input::placeholder': {
                  color: 'rgba(0, 0, 0, 0.6)',
                  opacity: 1
                },
                '& .MuiOutlinedInput-root': {
                  minHeight: '40px',
                  height: '40px',
                  backgroundColor: 'rgba(255, 255, 255, 0.95) !important',
                  '& fieldset': {
                    borderColor: '#4caf50 !important',
                    borderWidth: '2px !important'
                  },
                  '&:hover fieldset': {
                    borderColor: '#2e7d32 !important',
                    borderWidth: '2px !important'
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#1b5e20 !important',
                    borderWidth: '3px !important'
                  }
                }
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
                '& .MuiInputBase-input': { 
                  fontSize: '0.875rem',
                  color: 'rgba(0, 0, 0, 0.87)'
                },
                '& .MuiInputLabel-root': {
                  color: '#4caf50 !important',
                  fontWeight: '600 !important',
                  fontSize: '0.9rem !important',
                  '&.Mui-focused': {
                    color: '#2e7d32 !important',
                    fontWeight: '700 !important'
                  }
                },
                '& .MuiOutlinedInput-input::placeholder': {
                  color: 'rgba(0, 0, 0, 0.6)',
                  opacity: 1
                },
                '& .MuiOutlinedInput-root': {
                  minHeight: '40px',
                  height: '40px',
                  backgroundColor: 'rgba(255, 255, 255, 0.95) !important',
                  '& fieldset': {
                    borderColor: '#4caf50 !important',
                    borderWidth: '2px !important'
                  },
                  '&:hover fieldset': {
                    borderColor: '#2e7d32 !important',
                    borderWidth: '2px !important'
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#1b5e20 !important',
                    borderWidth: '3px !important'
                  }
                }
              }}
            />
          </Grid>
          <Grid item xs={2.5} sm={3}>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
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
                componentsProps={{
                  popper: {
                    sx: {
                      '& .MuiAutocomplete-listbox': {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        '& .MuiAutocomplete-option': {
                          color: 'white',
                          backgroundColor: 'transparent !important',
                          '&:hover': {
                            backgroundColor: 'rgba(76, 175, 80, 0.1) !important'
                          },
                          '&[aria-selected="true"]': {
                            backgroundColor: 'transparent !important'
                          },
                          '&.Mui-focused': {
                            backgroundColor: 'rgba(76, 175, 80, 0.1) !important'
                          }
                        }
                      },
                      '& .MuiPaper-root': {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        backdropFilter: 'blur(10px)'
                      }
                    }
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Lead"
                    placeholder={selectedLeads.length > 0 ? "" : "Who?"}
                    variant="outlined"
                    size="small"
                    sx={{ 
                      borderRadius: 2,
                      '& .MuiInputBase-input': { 
                        fontSize: '0.875rem',
                        color: 'rgba(0, 0, 0, 0.87)'
                      },
                      '& .MuiInputLabel-root': {
                        color: '#4caf50 !important',
                        fontWeight: '600 !important',
                        fontSize: '0.9rem !important',
                        '&.Mui-focused': {
                          color: '#2e7d32 !important',
                          fontWeight: '700 !important'
                        }
                      },
                      '& .MuiOutlinedInput-input::placeholder': {
                        color: 'rgba(0, 0, 0, 0.6)',
                        opacity: 1
                      },
                      '& .MuiOutlinedInput-input': {
                        color: 'rgba(0, 0, 0, 0.87)'
                      },
                      '& .MuiOutlinedInput-root': {
                        minHeight: '40px',
                        height: '40px',
                        backgroundColor: 'rgba(255, 255, 255, 0.95) !important',
                        '& fieldset': {
                          borderColor: '#4caf50 !important',
                          borderWidth: '2px !important'
                        },
                        '&:hover fieldset': {
                          borderColor: '#2e7d32 !important',
                          borderWidth: '2px !important'
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#1b5e20 !important',
                          borderWidth: '3px !important'
                        }
                      }
                    }}
                    helperText=""
                  />
                )}
                renderOption={(props, option) => {
                  const isSelected = selectedLeads.some(lead => lead.name === option.name);
                  return (
                    <Box component="li" {...props} sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1,
                      backgroundColor: 'transparent !important',
                      '&:hover': {
                        backgroundColor: 'rgba(76, 175, 80, 0.1) !important'
                      }
                    }}>
                      <Box sx={{ 
                        width: 20, 
                        height: 20, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        color: isSelected ? '#4caf50' : 'transparent'
                      }}>
                        ✓
                      </Box>
                      <Box>
                        <Typography variant="body2" fontWeight="medium" sx={{ color: 'white' }}>
                          {option.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                          {option.patrol || 'No Patrol'}
                        </Typography>
                      </Box>
                    </Box>
                  );
                }}
                renderTags={() => null}
              />
              {/* Render chips outside the input field */}
              {selectedLeads.length > 0 && (
                <Box sx={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: 0.5, 
                  alignItems: 'center',
                  mt: 1
                }}>
                  {selectedLeads.map((option, index) => (
                    <Chip
                      key={option.id || option.name}
                      label={option.name}
                      onDelete={() => {
                        const newLeads = selectedLeads.filter((_, i) => i !== index);
                        onUpdate({ ...activity, lead: newLeads });
                      }}
                      size="small"
                      sx={{
                        backgroundColor: 'rgb(0 93 19 / 90%) !important',
                        borderRadius: '5px',
                        color: 'white',
                        fontSize: '0.75rem',
                        height: '24px',
                        maxWidth: '120px',
                        '& .MuiChip-label': {
                          paddingX: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        },
                        '& .MuiChip-deleteIcon': {
                          color: 'white',
                          fontSize: '14px',
                          marginRight: '4px'
                        }
                      }}
                    />
                  ))}
                </Box>
              )}
            </Box>
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md')); // Hide columns on screens smaller than 'md' (960px)
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [tabValue, setTabValue] = useState(0);
  const [outingTypeTab, setOutingTypeTab] = useState(0); // 0 = Troop, 1 = Patrol
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [loading, setLoading] = useState(false);
  const [scheduleWarningDialog, setScheduleWarningDialog] = useState({
    open: false,
    daysToLose: 0,
    onConfirm: null,
    onCancel: null
  });
  const previewRef = useRef();
  const [outingListExpanded, setOutingListExpanded] = useState(true);
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);

  // Form state
  const [outingData, setOutingData] = useState({
    eventName: '',
    type: 'troop', // 'troop' or 'patrol'
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
    coverImage: 'bluesky', // Background image for hero section
    isPublic: true // Visibility setting
  });

  // Track original content for image cleanup
  const [originalOutingData, setOriginalOutingData] = useState(null);
  const [initialImageList, setInitialImageList] = useState([]);

  // Real data from Firebase
  const [existingOutings, setExistingOutings] = useState([]);
  const [loadingOutings, setLoadingOutings] = useState(true);
  const [currentOutingId, setCurrentOutingId] = useState(null); // Track if editing existing outing
  const [showEditor, setShowEditor] = useState(false); // Track if editor should be visible
  
  // Table state
  const [searchQuery, setSearchQuery] = useState('');
  const [startDateFilter, setStartDateFilter] = useState(null);
  const [endDateFilter, setEndDateFilter] = useState(null);
  const [displayedOutings, setDisplayedOutings] = useState(10); // For infinite scroll
  const [hasMoreOutings, setHasMoreOutings] = useState(true);
  
  // Sorting state
  const [sortField, setSortField] = useState('startDateTime'); // Default sort by start date
  const [sortDirection, setSortDirection] = useState('asc'); // Default ascending


  // Real user data from database
  const [scouts, setScouts] = useState([]);
  const [adults, setAdults] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

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

  // Filter outings based on type and user permissions
  const getFilteredOutings = () => {
    if (!existingOutings) return [];
    
    const currentType = outingTypeTab === 0 ? 'troop' : 'patrol';
    
    const filtered = existingOutings.filter(outing => {
      // Filter by type (default to 'troop' if not specified for backward compatibility)
      const outingType = outing.type || 'troop';
      if (outingType !== currentType) return false;
      
      // Show public outings to everyone
      if (outing.isPublic) return true;
      
      // If currentUser is not loaded yet, show all public outings but no private ones
      if (!currentUser) return false;
      
      // Show private outings only if user is associated (SIC or AIC)
      const userEmail = currentUser.email;
      const userName = currentUser.name;
      
      const isAssociated = 
        (outing.sics && outing.sics.some(sic => {
          // Handle both string and object formats
          if (typeof sic === 'string') return sic === userName;
          return sic.email === userEmail || sic.name === userName;
        })) ||
        (outing.aics && outing.aics.some(aic => {
          // Handle both string and object formats
          if (typeof aic === 'string') return aic === userName;
          return aic.email === userEmail || aic.name === userName;
        }));
      
      return isAssociated;
    });
    
    // Debug logging
    console.log(`Filtering for ${currentType} outings:`, {
      totalOutings: existingOutings.length,
      filteredCount: filtered.length,
      currentUser: currentUser?.name,
      filtered: filtered.map(o => ({ name: o.eventName, type: o.type, isPublic: o.isPublic }))
    });
    
    return filtered;
  };

  // Load outings and users from Firebase on component mount
  useEffect(() => {
    loadOutings();
    loadUsers();
    loadCurrentUser();
  }, []);

  // Handle URL packet parameter
  useEffect(() => {
    const packetId = searchParams.get('packet');
    if (packetId === 'new') {
      // Handle new outing case - don't try to load from existing outings
      setShowEditor(true);
    } else if (packetId && existingOutings.length > 0) {
      const outing = existingOutings.find(o => o.id === packetId);
      if (outing) {
        loadOutingForEdit(outing);
      } else {
        // Packet ID not found, clear URL and hide editor
        setSearchParams({});
        setShowEditor(false);
        setCurrentOutingId(null);
      }
    } else if (!packetId) {
      // No packet specified, hide editor
      setShowEditor(false);
      setCurrentOutingId(null);
    }
  }, [searchParams, existingOutings]);

  // Refresh filtered outings when tab changes
  useEffect(() => {
    // This will trigger a re-render when outingTypeTab changes
    // The filteredOutings will be recalculated automatically
  }, [outingTypeTab, existingOutings, currentUser]);
  
  // Load current user information
  const loadCurrentUser = async () => {
    try {
      const user = await authService.getCurrentUser();
      setCurrentUser(user);
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  };

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
      const processedOutings = outings.map(outing => {
        const processed = outingService.processOutingData(outing);
        // Add type field if missing (backward compatibility)
        if (!processed.type) {
          processed.type = 'troop'; // Default to troop for existing outings
        }
        return processed;
      });
      setExistingOutings(processedOutings);
      
      // Log for debugging
      console.log('Loaded outings with types:', processedOutings.map(o => ({ 
        name: o.eventName, 
        type: o.type, 
        isPublic: o.isPublic 
      })));
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
  const filteredOutings = getFilteredOutings().filter(outing => {
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

  // Sort outings based on current sort field and direction
  const sortedOutings = [...filteredOutings].sort((a, b) => {
    let valueA, valueB;
    
    if (sortField === 'startDateTime' || sortField === 'endDateTime') {
      valueA = new Date(a[sortField] || 0);
      valueB = new Date(b[sortField] || 0);
    } else {
      valueA = a[sortField] || '';
      valueB = b[sortField] || '';
    }
    
    if (sortDirection === 'asc') {
      return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
    } else {
      return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
    }
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
    
    const loadedData = {
      eventName: outing.eventName,
      type: outing.type || 'troop', // Default to troop if not specified
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
      coverImage: outing.coverImage || 'bluesky', // Add coverImage field
      isPublic: outing.isPublic
    };
    
    setOutingData(loadedData);
    // Store original data for image cleanup comparison
    setOriginalOutingData(loadedData);
    
    // Extract and store initial image list for batch cleanup
    const initialImages = googleDriveService.extractAllImagesFromOuting(loadedData);
    setInitialImageList(initialImages);
    console.log(`Loaded outing with ${initialImages.length} images:`, initialImages);
    
    setTabValue(0); // Switch to edit tab
    setShowEditor(true); // Show the editor section
    // Set URL parameter for existing outing
    setSearchParams({ packet: outing.id });
  };

  const createNewOuting = () => {
    setCurrentOutingId(null); // Clear the ID for new outing
    setOriginalOutingData(null); // Clear original data for new outing
    setInitialImageList([]); // Clear initial image list for new outing
    setOutingData({
      eventName: '',
      type: outingTypeTab === 0 ? 'troop' : 'patrol', // Set type based on current tab
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
    setShowEditor(true); // Show the editor section
    // Set URL parameter for new outing
    setSearchParams({ packet: 'new' });
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

  // Handle date changes and preserve existing schedule
  const handleDateChange = (field, value) => {
    // Validate date order when setting end date
    if (field === 'endDateTime' && value && outingData.startDateTime) {
      const startDate = outingData.startDateTime;
      if (value < startDate) {
        setSnackbar({
          open: true,
          message: `End date cannot be before start date. Please select a date on or after ${startDate.toLocaleDateString()}.`,
          severity: 'error'
        });
        return; // Don't update the state with invalid date
      }
    }
    
    // Validate date order when setting start date
    if (field === 'startDateTime' && value && outingData.endDateTime) {
      const endDate = outingData.endDateTime;
      if (value > endDate) {
        setSnackbar({
          open: true,
          message: `Start date cannot be after end date. Please select a date on or before ${endDate.toLocaleDateString()}.`,
          severity: 'error'
        });
        return; // Don't update the state with invalid date
      }
    }

    setOutingData(prev => {
      const updated = {
        ...prev,
        [field]: value
      };

      // Update schedule days when both dates are set
      if (field === 'startDateTime' || field === 'endDateTime') {
        const startDate = field === 'startDateTime' ? value : prev.startDateTime;
        const endDate = field === 'endDateTime' ? value : prev.endDateTime;

        if (startDate && endDate && startDate instanceof Date && endDate instanceof Date && 
            !isNaN(startDate.getTime()) && !isNaN(endDate.getTime()) && startDate <= endDate) {
          
          // Calculate number of days (inclusive of start and end dates)
          const timeDiff = endDate.getTime() - startDate.getTime();
          const newDayCount = Math.floor(timeDiff / (1000 * 3600 * 24)) + 1; // +1 to include both start and end dates
          const currentDayCount = prev.scheduleDays?.length || 0;
          
          if (currentDayCount === 0) {
            // No existing schedule - create new empty days
            const newScheduleDays = [];
            for (let i = 0; i < newDayCount; i++) {
              newScheduleDays.push({
                id: `day-${i + 1}`,
                title: `Day ${i + 1}`,
                activities: []
              });
            }
            updated.scheduleDays = newScheduleDays;
            console.log(`Auto-generated ${newDayCount} schedule days for new outing`);
          } else if (newDayCount !== currentDayCount) {
            // Duration changed - preserve existing activities and adjust days
            const existingScheduleDays = [...prev.scheduleDays];
            
            if (newDayCount > currentDayCount) {
              // Duration increased - add new empty days
              for (let i = currentDayCount; i < newDayCount; i++) {
                existingScheduleDays.push({
                  id: `day-${i + 1}`,
                  title: `Day ${i + 1}`,
                  activities: []
                });
              }
              updated.scheduleDays = existingScheduleDays;
              console.log(`Extended schedule from ${currentDayCount} to ${newDayCount} days`);
            } else {
              // Duration decreased - warn user about losing days
              const daysToLose = currentDayCount - newDayCount;
              const activitiesInLostDays = existingScheduleDays
                .slice(newDayCount)
                .some(day => day.activities && day.activities.length > 0);
              
              if (activitiesInLostDays) {
                // Show warning dialog
                setScheduleWarningDialog({
                  open: true,
                  daysToLose: daysToLose,
                  onConfirm: () => {
                    // User confirmed - truncate schedule
                    setOutingData(prevData => ({
                      ...prevData,
                      scheduleDays: prevData.scheduleDays.slice(0, newDayCount)
                    }));
                    console.log(`Truncated schedule from ${currentDayCount} to ${newDayCount} days (with user confirmation)`);
                    setScheduleWarningDialog({ open: false, daysToLose: 0, onConfirm: null, onCancel: null });
                  },
                  onCancel: () => {
                    // User cancelled - revert the date change
                    console.log('Date change cancelled by user to preserve schedule');
                    setScheduleWarningDialog({ open: false, daysToLose: 0, onConfirm: null, onCancel: null });
                  }
                });
                return prev; // Don't apply the change yet, wait for dialog response
              } else {
                // No activities in lost days - safe to truncate
                updated.scheduleDays = existingScheduleDays.slice(0, newDayCount);
                console.log(`Truncated schedule from ${currentDayCount} to ${newDayCount} days (no activities lost)`);
              }
            }
          } else {
            // Same duration - just update date labels (preserve all activities)
            updated.scheduleDays = prev.scheduleDays;
            console.log(`Duration unchanged (${newDayCount} days) - preserved existing schedule`);
          }
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

  // Handle column sorting
  const handleSort = (field) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field with ascending direction
      setSortField(field);
      setSortDirection('asc');
    }
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

      // Clean up unused images if editing existing outing using batch approach
      if (currentOutingId && originalOutingData && initialImageList.length > 0) {
        try {
          console.log('Starting batch image cleanup...');
          
          // Use the new batch cleanup method
          const cleanupResult = await googleDriveService.cleanupUnusedImagesBatch(
            originalOutingData, 
            cleanedOutingData
          );
          
          if (cleanupResult.cleaned > 0) {
            console.log(`✅ Successfully batch deleted ${cleanupResult.cleaned} unused images`);
            setSnackbar({
              open: true,
              message: `Outing updated and cleaned up ${cleanupResult.cleaned} unused images!`,
              severity: 'success'
            });
          } else if (cleanupResult.message) {
            console.log(`ℹ️ Image cleanup: ${cleanupResult.message}`);
          }
          
          if (cleanupResult.errors.length > 0) {
            console.warn(`⚠️ Failed to clean up ${cleanupResult.errors.length} images:`, cleanupResult.errors);
          }
        } catch (cleanupError) {
          console.error('❌ Error during batch image cleanup:', cleanupError);
          // Don't fail the save operation due to cleanup errors
        }
      }

      if (currentOutingId) {
        // Update existing outing
        await outingService.updateOuting(currentOutingId, cleanedOutingData);
        // Only show update message if no cleanup message was already shown
        if (!(currentOutingId && originalOutingData && initialImageList.length > 0)) {
          setSnackbar({
            open: true,
            message: 'Outing plan updated successfully!',
            severity: 'success'
          });
        }
      } else {
        // Create new outing
        const newOutingId = await outingService.createOuting(cleanedOutingData);
        setCurrentOutingId(newOutingId);
        // Update URL parameter with the new outing ID
        setSearchParams({ packet: newOutingId });
        setSnackbar({
          open: true,
          message: 'Outing plan saved successfully!',
          severity: 'success'
        });
      }
      
      // Update tracking data for future comparisons
      setOriginalOutingData(cleanedOutingData);
      const newImageList = googleDriveService.extractAllImagesFromOuting(cleanedOutingData);
      setInitialImageList(newImageList);
      console.log(`Updated image tracking: ${newImageList.length} images`);
      
      // Reload the outings list to reflect changes
      await loadOutings();
      
      // Switch to preview tab
      setTabValue(5);
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

        {/* Outing Type Tabs */}
        <Box sx={{ mb: 3 }}>
          <Tabs 
            value={outingTypeTab} 
            onChange={(event, newValue) => setOutingTypeTab(newValue)}
            sx={{
              '& .MuiTab-root': {
                color: 'rgba(255, 255, 255, 0.7)',
                '&.Mui-selected': {
                  color: '#4caf50'
                }
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#4caf50'
              }
            }}
          >
            <Tab label="Troop Outings" />
            <Tab label="Patrol Outings" />
          </Tabs>
        </Box>

        {/* Outing Packets Table */}
        <Accordion 
          expanded={outingListExpanded} 
          onChange={null}
          sx={{ mt: 3, mb: 2 }}
        >
          <AccordionSummary 
            expandIcon={
              <ExpandMoreIcon 
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.9)',
                  cursor: 'pointer'
                }} 
                onClick={(e) => {
                  e.stopPropagation();
                  setOutingListExpanded(!outingListExpanded);
                }}
              />
            }
            sx={{
              cursor: 'default',
              '& .MuiAccordionSummary-content': {
                cursor: 'default'
              },
              '& .MuiAccordionSummary-expandIconWrapper': {
                color: 'rgba(255, 255, 255, 0.9)',
                cursor: 'pointer'
              },
              '& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': {
                color: 'rgba(255, 255, 255, 0.9)',
              }
            }}
            onClick={(e) => e.preventDefault()}
          >
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              width: '100%', 
              gap: isMobile ? 1 : 2,
              flexWrap: isMobile ? 'wrap' : 'nowrap'
            }}>
              <EventIcon sx={{ color: 'primary.main' }} />
              <Typography variant="h6" sx={{ minWidth: 'fit-content' }}>
                Outing Packets ({sortedOutings.length})
              </Typography>
              
              {/* Search Field */}
              <TextField
                placeholder="Search outings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                size="small"
                sx={{ 
                  flexGrow: 1, 
                  minWidth: isMobile ? 150 : 200,
                  maxWidth: isMobile ? 200 : 'none',
                  '& .MuiOutlinedInput-root': {
                    height: '48px'
                  },
                  '& .MuiOutlinedInput-input::placeholder': {
                    color: 'rgba(255, 255, 255, 0.7)',
                    opacity: 1
                  },
                  '& .MuiOutlinedInput-input': {
                    color: 'rgba(255, 255, 255, 0.9)'
                  },
                  '& .MuiOutlinedInput-input': {
                    padding: isMobile ? '12px 14px' : '20px 14px'
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery && (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSearchQuery('');
                        }}
                        edge="end"
                      >
                        <CloseIcon />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
                onClick={(e) => e.stopPropagation()}
              />
              
              {/* Start Date Filter */}
              <Box sx={{ position: 'relative', minWidth: isMobile ? 100 : 140 }}>
                <DateTimePicker
                  label="Start"
                  value={startDateFilter}
                  onChange={(value) => setStartDateFilter(value)}
                  views={['year', 'month', 'day']}
                  componentsProps={{
                    popper: {
                      sx: {
                        '& .MuiPaper-root': {
                          backgroundColor: 'rgba(0, 0, 0, 0.9)',
                          backdropFilter: 'blur(20px)',
                          border: '1px solid rgba(76, 175, 80, 0.5)',
                          color: 'white'
                        },
                        '& .MuiPickersCalendarHeader-root': {
                          backgroundColor: 'rgba(0, 0, 0, 0.9)',
                          color: 'white'
                        },
                        '& .MuiPickersCalendarHeader-label': {
                          color: 'white'
                        },
                        '& .MuiPickersArrowSwitcher-button': {
                          color: 'white'
                        },
                        '& .MuiDayCalendar-weekDayLabel': {
                          color: 'rgba(255, 255, 255, 0.7)'
                        },
                        '& .MuiPickersDay-root': {
                          color: 'white',
                          '&:hover': {
                            backgroundColor: 'rgba(76, 175, 80, 0.3)'
                          },
                          '&.Mui-selected': {
                            backgroundColor: '#4caf50',
                            color: 'white'
                          }
                        }
                      }
                    }
                  }}
                  renderInput={(params) => (
                    <TextField 
                      {...params} 
                      size="small"
                      sx={{
                        width: isMobile ? 100 : 140,
                        '& .MuiOutlinedInput-root': {
                          minHeight: isMobile ? '48px' : '64px',
                          height: isMobile ? '48px' : '64px',
                          '& fieldset': {
                            height: isMobile ? '48px' : '64px'
                          }
                        },
                        '& .MuiOutlinedInput-input': {
                          padding: isMobile ? '12px 8px' : '20px 14px',
                          fontSize: isMobile ? '0.875rem' : '1rem',
                          height: 'auto'
                        },
                        '& .MuiInputLabel-root': {
                          fontSize: isMobile ? '0.875rem' : '1rem'
                        },
                        '& .MuiInputAdornment-root': {
                          height: isMobile ? '48px' : '64px'
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}
                />
                {startDateFilter && (
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      setStartDateFilter(null);
                    }}
                    sx={{
                      position: 'absolute',
                      right: 35,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      p: 0.5,
                      zIndex: 1
                    }}
                    title="Clear start date"
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
              
              {/* End Date Filter */}
              <Box sx={{ position: 'relative', minWidth: isMobile ? 100 : 140 }}>
                <DateTimePicker
                  label="End"
                  value={endDateFilter}
                  onChange={(value) => setEndDateFilter(value)}
                  views={['year', 'month', 'day']}
                  componentsProps={{
                    popper: {
                      sx: {
                        '& .MuiPaper-root': {
                          backgroundColor: 'rgba(0, 0, 0, 0.9)',
                          backdropFilter: 'blur(20px)',
                          border: '1px solid rgba(76, 175, 80, 0.5)',
                          color: 'white'
                        },
                        '& .MuiPickersCalendarHeader-root': {
                          backgroundColor: 'rgba(0, 0, 0, 0.9)',
                          color: 'white'
                        },
                        '& .MuiPickersCalendarHeader-label': {
                          color: 'white'
                        },
                        '& .MuiPickersArrowSwitcher-button': {
                          color: 'white'
                        },
                        '& .MuiDayCalendar-weekDayLabel': {
                          color: 'rgba(255, 255, 255, 0.7)'
                        },
                        '& .MuiPickersDay-root': {
                          color: 'white',
                          '&:hover': {
                            backgroundColor: 'rgba(76, 175, 80, 0.3)'
                          },
                          '&.Mui-selected': {
                            backgroundColor: '#4caf50',
                            color: 'white'
                          }
                        }
                      }
                    }
                  }}
                  renderInput={(params) => (
                    <TextField 
                      {...params} 
                      size="small"
                      sx={{
                        width: isMobile ? 100 : 140,
                        '& .MuiOutlinedInput-root': {
                          minHeight: isMobile ? '48px' : '64px',
                          height: isMobile ? '48px' : '64px',
                          '& fieldset': {
                            height: isMobile ? '48px' : '64px'
                          }
                        },
                        '& .MuiOutlinedInput-input': {
                          padding: isMobile ? '12px 8px' : '20px 14px',
                          fontSize: isMobile ? '0.875rem' : '1rem',
                          height: 'auto'
                        },
                        '& .MuiInputLabel-root': {
                          fontSize: isMobile ? '0.875rem' : '1rem'
                        },
                        '& .MuiInputAdornment-root': {
                          height: isMobile ? '48px' : '64px'
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}
                />
                {endDateFilter && (
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEndDateFilter(null);
                    }}
                    sx={{
                      position: 'absolute',
                      right: 35,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      p: 0.5,
                      zIndex: 1
                    }}
                    title="Clear end date"
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
              
              {/* New Outing Button */}
              <Button
                variant="contained"
                size="small"
                startIcon={!isMobile && <AddIcon />}
                onClick={(e) => {
                  e.stopPropagation();
                  createNewOuting();
                }}
                sx={{ 
                  minWidth: 'fit-content',
                  fontSize: '0.875rem',
                  padding: '6px 16px',
                  height: '48px'
                }}
              >
                New Outing
              </Button>
            </Box>
          </AccordionSummary>
          <AccordionDetails>

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
                <TableContainer component={Paper} sx={{ 
                  maxHeight: 600, 
                  overflow: 'auto',
                  '& .MuiTableCell-root': {
                    ...(isMobile && {
                      padding: '8px 4px', // Reduce padding on mobile
                      fontSize: '0.875rem' // Smaller font size on mobile
                    })
                  }
                }}>
                  <Table stickyHeader size={isMobile ? "small" : "medium"}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ width: isMobile ? '40px' : 'auto', minWidth: isMobile ? '40px' : 'auto' }}>
                          <strong>{isMobile ? '' : 'Sharing'}</strong>
                        </TableCell>
                        <TableCell><strong>Outing Name</strong></TableCell>
                        <TableCell 
                          sx={{ cursor: 'pointer', userSelect: 'none' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSort('startDateTime');
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <strong>Start</strong>
                            {sortField === 'startDateTime' ? (
                              sortDirection === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />
                            ) : (
                              <UnfoldMoreIcon fontSize="small" sx={{ opacity: 0.5 }} />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell 
                          sx={{ cursor: 'pointer', userSelect: 'none' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSort('endDateTime');
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <strong>End</strong>
                            {sortField === 'endDateTime' ? (
                              sortDirection === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />
                            ) : (
                              <UnfoldMoreIcon fontSize="small" sx={{ opacity: 0.5 }} />
                            )}
                          </Box>
                        </TableCell>
                        {!isMobile && <TableCell><strong>SICs</strong></TableCell>}
                        {!isMobile && <TableCell><strong>AICs</strong></TableCell>}
                        <TableCell><strong>Live View</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {displayedOutingsList.map((outing) => (
                        <TableRow 
                          key={outing.id} 
                          hover
                          selected={currentOutingId === outing.id}
                          onClick={() => loadOutingForEdit(outing)}
                          sx={{ 
                            cursor: 'pointer',
                            '&.Mui-selected': {
                              backgroundColor: 'rgba(76, 175, 80, 0.2)',
                              border: '2px solid #4caf50',
                              boxShadow: '0 2px 8px rgba(76, 175, 80, 0.3)',
                              '&:hover': {
                                backgroundColor: 'rgba(76, 175, 80, 0.3)',
                                boxShadow: '0 4px 12px rgba(76, 175, 80, 0.4)'
                              }
                            },
                            '&:hover': {
                              backgroundColor: 'rgba(255, 255, 255, 0.1)'
                            }
                          }}
                        >
                          <TableCell sx={{ width: isMobile ? '40px' : 'auto', textAlign: 'center' }}>
                            {isMobile ? (
                              <Tooltip title={outing.isPublic ? "Public" : "Private"}>
                                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                  {outing.isPublic ? 
                                    <VisibilityIcon fontSize="small" color="success" /> : 
                                    <VisibilityOffIcon fontSize="small" color="error" />
                                  }
                                </Box>
                              </Tooltip>
                            ) : (
                              <Chip 
                                icon={outing.isPublic ? <VisibilityIcon /> : <VisibilityOffIcon />} 
                                label={outing.isPublic ? "Public" : "Private"} 
                                size="small" 
                                color={outing.isPublic ? "success" : "error"} 
                                variant="outlined"
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography 
                              variant="body2" 
                              fontWeight="medium"
                              sx={{ 
                                ...(isMobile && {
                                  wordBreak: 'break-word',
                                  hyphens: 'auto',
                                  lineHeight: 1.2
                                })
                              }}
                            >
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
                          {!isMobile && (
                            <TableCell>
                              <Typography variant="body2">
                                {outing.sics?.length > 0 
                                  ? highlightText(outing.sics.map(sic => sic.name).join(', '), searchQuery)
                                  : 'None assigned'
                                }
                              </Typography>
                            </TableCell>
                          )}
                          {!isMobile && (
                            <TableCell>
                              <Typography variant="body2">
                                {outing.aics?.length > 0 
                                  ? highlightText(outing.aics.map(aic => aic.name).join(', '), searchQuery)
                                  : 'None assigned'
                                }
                              </Typography>
                            </TableCell>
                          )}
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                              <Tooltip title="Open live view">
                                <IconButton 
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const liveViewUrl = `/outing/${outing.id}`;
                                    window.open(liveViewUrl, '_blank', 'width=1200,height=800');
                                  }}
                                  color="secondary"
                                >
                                  <OpenInNewIcon fontSize="small" />
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

        {/* Editor Section - Show when an outing is selected or when creating new */}
        {showEditor && (
          <Paper id="content-editor" sx={{ mt: 3 }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange}
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab 
                icon={<DescriptionIcon />} 
                label="Packet" 
                iconPosition="start"
              />
              <Tab 
                icon={<PersonAddIcon />} 
                label="Signup" 
                iconPosition="start"
              />
              <Tab 
                icon={<PeopleIcon />} 
                label="Participation" 
                iconPosition="start"
              />
              <Tab 
                icon={<PhotoLibraryIcon />} 
                label="Photos" 
                iconPosition="start"
              />
              <Tab 
                icon={<AssignmentIcon />} 
                label="Reflection" 
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
            {/* Event Name Header with Toggle - Only in Edit Tab */}
            <Box sx={{ 
              py: 3, 
              textAlign: 'center'
            }}>
              <Typography variant="h1" sx={{ 
                fontWeight: 600,
                color: '#333',
                fontSize: '3rem',
                mb: 2
              }}>
                {outingData.eventName}
              </Typography>
              
              {/* Public/Private Toggle under title */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                mt: 2
              }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={Boolean(outingData.isPublic)}
                      onChange={(e) => {
                        console.log('Switch clicked, changing from', outingData.isPublic, 'to', e.target.checked);
                        handleInputChange('isPublic', e.target.checked);
                      }}
                      color="primary"
                      sx={{
                        '& .MuiSwitch-track': {
                          backgroundColor: outingData.isPublic ? '#4caf50' : '#f44336',
                        },
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: '#4caf50',
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: '#4caf50',
                        }
                      }}
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {outingData.isPublic ? 'Public' : 'Private'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        {outingData.isPublic ? '(Visible to everyone)' : '(SICs & AICs only)'}
                      </Typography>
                    </Box>
                  }
                />
              </Box>
            </Box>
            <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
              {/* Basic Information Header */}
              <Box sx={{ 
                pb: 4
              }}>
                <Typography variant="h5" sx={{ fontWeight: 600, color: '#1976d2' }}>
                  Basic Information
                </Typography>
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
                        minHeight: '56px',
                      },
                      '& .MuiOutlinedInput-input::placeholder': {
                        color: 'rgba(255, 255, 255, 0.7)',
                        opacity: 1
                      },
                      '& .MuiOutlinedInput-input': {
                        color: 'white',
                        height: '56px'
                      }
                    }}
                  />
                </Grid>

                <Grid item xs={6} sm={3} md={3}>
                  <DatePicker
                    label="Start Date *"
                    value={outingData.startDateTime}
                    onChange={(value) => handleDateChange('startDateTime', value)}
                    maxDate={outingData.endDateTime || undefined}
                    componentsProps={{
                      popper: {
                        sx: {
                          '& .MuiPaper-root': {
                            backgroundColor: 'rgba(0, 0, 0, 0.9)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(76, 175, 80, 0.5)',
                            color: 'white'
                          },
                          '& .MuiPickersCalendarHeader-root': {
                            backgroundColor: 'rgba(0, 0, 0, 0.9)',
                            color: 'white'
                          },
                          '& .MuiPickersCalendarHeader-label': {
                            color: 'white'
                          },
                          '& .MuiPickersArrowSwitcher-button': {
                            color: 'white'
                          },
                          '& .MuiDayCalendar-weekDayLabel': {
                            color: 'rgba(255, 255, 255, 0.7)'
                          },
                          '& .MuiPickersDay-root': {
                            color: 'white',
                            '&:hover': {
                              backgroundColor: 'rgba(76, 175, 80, 0.3)'
                            },
                            '&.Mui-selected': {
                              backgroundColor: '#4caf50',
                              color: 'white'
                            }
                          }
                        }
                      }
                    }}
                    renderInput={(params) => (
                      <TextField 
                        {...params} 
                        fullWidth 
                        required
                        variant="outlined"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            minHeight: '56px',
                            height: '56px',
                            '& input': {
                              height: 'auto',
                              padding: '16.5px 14px'
                            }
                          },
                          '& .MuiInputBase-root': {
                            minHeight: '56px',
                            height: '56px'
                          },
                          '& .MuiInputAdornment-root': {
                            height: '56px'
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
                    minDate={outingData.startDateTime || undefined}
                    componentsProps={{
                      popper: {
                        sx: {
                          '& .MuiPaper-root': {
                            backgroundColor: 'rgba(0, 0, 0, 0.9)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(76, 175, 80, 0.5)',
                            color: 'white'
                          },
                          '& .MuiPickersCalendarHeader-root': {
                            backgroundColor: 'rgba(0, 0, 0, 0.9)',
                            color: 'white'
                          },
                          '& .MuiPickersCalendarHeader-label': {
                            color: 'white'
                          },
                          '& .MuiPickersArrowSwitcher-button': {
                            color: 'white'
                          },
                          '& .MuiDayCalendar-weekDayLabel': {
                            color: 'rgba(255, 255, 255, 0.7)'
                          },
                          '& .MuiPickersDay-root': {
                            color: 'white',
                            '&:hover': {
                              backgroundColor: 'rgba(76, 175, 80, 0.3)'
                            },
                            '&.Mui-selected': {
                              backgroundColor: '#4caf50',
                              color: 'white'
                            }
                          }
                        }
                      }
                    }}
                    renderInput={(params) => (
                      <TextField 
                        {...params} 
                        fullWidth 
                        required
                        variant="outlined"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            minHeight: '56px',
                            height: '56px',
                            '& input': {
                              height: 'auto',
                              padding: '16.5px 14px'
                            }
                          },
                          '& .MuiInputBase-root': {
                            minHeight: '56px',
                            height: '56px'
                          },
                          '& .MuiInputAdornment-root': {
                            height: '56px'
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
                        minHeight: '56px',
                        height: '56px'
                      },
                      '& .MuiOutlinedInput-input::placeholder': {
                        color: 'rgba(255, 255, 255, 0.7)',
                        opacity: 1
                      },
                      '& .MuiOutlinedInput-input': {
                        color: 'white'
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
                        minHeight: '56px',
                      },
                      '& .MuiOutlinedInput-input::placeholder': {
                        color: 'rgba(255, 255, 255, 0.7)',
                        opacity: 1
                      },
                      '& .MuiOutlinedInput-input': {
                        color: 'white',
                        height: '56px'
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
                      '& .MuiOutlinedInput-input::placeholder': {
                        color: 'rgba(255, 255, 255, 0.7)',
                        opacity: 1
                      },
                      '& .MuiOutlinedInput-input': {
                        color: 'white'
                      },
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      }
                    }}
                  />
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => setHelpDialogOpen(true)}
                        startIcon={<HelpIcon />}
                        endIcon={<OpenInNewIcon />}
                        sx={{ 
                          mr: 1, 
                          minWidth: 'auto',
                          fontSize: '0.75rem',
                          padding: '4px 12px',
                          height: '28px',
                          backgroundColor: '#1976d2',
                          color: 'white',
                          borderRadius: '14px',
                          textTransform: 'none',
                          fontWeight: 500,
                          '&:hover': {
                            backgroundColor: '#1565c0',
                            transform: 'translateY(-1px)',
                            boxShadow: '0 2px 8px rgba(25, 118, 210, 0.3)'
                          },
                          transition: 'all 0.2s ease-in-out'
                        }}
                      >
                        Instructions
                      </Button>
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
                  padding: '20px 10px 15px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(15px)',
                  WebkitBackdropFilter: 'blur(15px)',
                  borderRadius: 2,
                  border: 'none',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                }}>
                  <Autocomplete
                    id="sics-dropdown"
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
                    sx={{ 
                      '& .MuiInputBase-root': {
                        paddingTop: '20px !important'
                      },
                    }}
                    componentsProps={{
                      popper: {
                        sx: {
                          '& .MuiInputBase-root': {
                            paddingTop: '20px'
                          },
                          '& .MuiAutocomplete-listbox': {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            '& .MuiAutocomplete-option': {
                              color: 'white',
                              '&:hover': {
                                backgroundColor: 'rgba(76, 175, 80, 0.3)'
                              },
                              '&[aria-selected="true"]': {
                                backgroundColor: 'rgba(76, 175, 80, 0.5)'
                              }
                            }
                          },
                          '& .MuiPaper-root': {
                            backgroundColor: 'rgba(103, 60, 60, 0.8)',
                            backdropFilter: 'blur(10px)'
                          }
                        }
                      }
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="SICs"
                        placeholder={loadingUsers ? "Loading scouts..." : "Type to search scouts..."}
                        required
                        variant="outlined"
                        sx={{ 
                          borderRadius: 2,
                          '& .MuiOutlinedInput-input::placeholder': {
                            color: 'rgba(255, 255, 255, 0.7)',
                            opacity: 1
                          },
                          '& .MuiOutlinedInput-input': {
                            color: 'white'
                          }
                        }}
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
                          sx={{ 
                            height: 40,
                            fontSize: '1.0rem',
                            backgroundColor: 'rgb(0 93 19 / 90%) !important',
                            borderRadius: '5px',
                            color: 'white',
                            '& .MuiChip-deleteIcon': {
                              fontSize: '1.1rem',
                              color: 'white'
                            }
                          }}
                        />
                        );
                      })
                    }
                  />
                </Box>
              </Box>

              {/* Adult in Charge Section */}
              <Box sx={{ mb: 4, paddingTop: '20px' }}>
                <Typography variant="h5" sx={{ fontWeight: 600, color: '#1976d2', mb: 3 }}>
                  <PeopleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Adult In Charge
                </Typography>
                <Box sx={{ 
                  padding: '20px 10px 15px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(15px)',
                  WebkitBackdropFilter: 'blur(15px)',
                  borderRadius: 2,
                  border: 'none',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                }}>
                  <Autocomplete
                    id="aics-dropdown"
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
                    sx={{ 
                      '& .MuiInputBase-root': {
                        paddingTop: '20px !important'
                      },
                    }}
                    componentsProps={{
                      popper: {
                        sx: {
                          '& .MuiAutocomplete-listbox': {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            '& .MuiAutocomplete-option': {
                              color: 'white',
                              '&:hover': {
                                backgroundColor: 'rgba(76, 175, 80, 0.3)'
                              },
                              '&[aria-selected="true"]': {
                                backgroundColor: 'rgba(76, 175, 80, 0.5)'
                              }
                            }
                          },
                          '& .MuiPaper-root': {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            backdropFilter: 'blur(10px)'
                          }
                        }
                      }
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="AICs"
                        placeholder={loadingUsers ? "Loading adults..." : "Type to search adults/parents..."}
                        required
                        variant="outlined"
                        sx={{ 
                          borderRadius: 2,
                          '& .MuiOutlinedInput-input::placeholder': {
                            color: 'rgba(255, 255, 255, 0.7)',
                            opacity: 1
                          },
                          '& .MuiOutlinedInput-input': {
                            color: 'white'
                          }
                        }}
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
                          sx={{ 
                            height: 40,
                            fontSize: '1.0rem',
                            backgroundColor: 'rgb(0 93 19 / 90%) !important',
                            borderRadius: '5px',
                            color: 'white',
                            '& .MuiChip-deleteIcon': {
                              fontSize: '1.1rem',
                              color: 'white'
                            }
                          }}
                        />
                        );
                      })
                    }
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
                    outingData={outingData}
                  />
                </Box>
              </Box>

              {/* Detail Section */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="h5" sx={{ fontWeight: 600, color: '#1976d2', mb: 3 }}>
                  <AssignmentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Plan *
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
                    outingData={outingData}
                  />
                </Box>
              </Box>

              {/* Schedule Section */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="h5" sx={{ fontWeight: 600, color: 'white', mb: 3, textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)' }}>
                  <ScheduleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Schedule *
                </Typography>
                
                <DndContext 
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <Box sx={{ 
                    background: 'rgba(255, 255, 255, 0.15)', 
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    borderRadius: 2, 
                    p: 3, 
                    border: '1px solid rgba(76, 175, 80, 0.2)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)' 
                  }}>
                    {!outingData.scheduleDays || outingData.scheduleDays.length === 0 ? (
                      <Box sx={{ 
                        p: 4, 
                        textAlign: 'center', 
                        color: 'rgba(0, 0, 0, 0.7)',
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        borderRadius: 2,
                        border: '2px dashed rgba(76, 175, 80, 0.4)',
                        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
                      }}>
                        <Typography variant="body1" sx={{ mb: 2, color: 'rgba(0, 0, 0, 0.8)', fontWeight: 500 }}>
                          📅 Schedule days will be automatically generated
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(0, 0, 0, 0.6)' }}>
                          Set both Start Date and End Date above to create day containers
                        </Typography>
                      </Box>
                    ) : (
                      (outingData.scheduleDays || []).map((day, dayIndex) => {
                      const dayDate = generateDayDate(dayIndex);
                      return (
                        <Box key={day.id} sx={{ 
                          background: 'rgba(255, 255, 255, 0.1)',
                          backdropFilter: 'blur(15px)',
                          WebkitBackdropFilter: 'blur(15px)',
                          borderRadius: 3,
                          border: 'none',
                          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                          overflow: 'hidden',
                          mb: 4
                        }}>
                          <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            px: 3,
                            py: '10px',
                            background: 'linear-gradient(135deg, #4caf50, #45a049)',
                            backdropFilter: 'blur(10px)',
                            WebkitBackdropFilter: 'blur(10px)',
                            color: 'white',
                            boxShadow: '0 2px 8px rgba(76, 175, 80, 0.3)'
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
                                  backgroundColor: '#4caf50',
                                  color: 'white',
                                  borderRadius: '5px',
                                  textTransform: 'none',
                                  padding: '5px 10px',
                                  boxShadow: '0 2px 8px rgba(76, 175, 80, 0.3)',
                                  '&:hover': {
                                    backgroundColor: '#45a049',
                                    boxShadow: '0 4px 12px rgba(76, 175, 80, 0.4)'
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
                                    color: 'white',
                                    '&:hover': {
                                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                      color: 'white'
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
                                color: 'rgba(255, 255, 255, 0.95)',
                                backgroundColor: 'rgba(76, 175, 80, 0.15)',
                                borderRadius: 2,
                                border: '1px dashed rgba(255, 255, 255, 0.8)',
                                mx: 2,
                                mb: 2
                              }}>
                                <Typography variant="body2" sx={{ 
                                  color: 'rgba(255, 255, 255, 0.95) !important',
                                  fontWeight: 600,
                                  fontSize: '1.1rem',
                                  textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)'
                                }}>
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
                    outingData={outingData}
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
                    outingData={outingData}
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
                    outingData={outingData}
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
                    outingData={outingData}
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
                    outingData={outingData}
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
                    outingData={outingData}
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
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
              borderRadius: '15px 15px 0 0',
              boxShadow: '0 0 15px 2px rgba(0, 0, 0, 0.3)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              p: 3,
              display: 'flex',
              justifyContent: 'center',
              gap: 2,
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
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<PreviewIcon />}
                  onClick={() => {
                    setTabValue(5);
                    // Scroll to the content-editor section with header offset after a short delay
                    setTimeout(() => {
                      const contentEditor = document.getElementById('content-editor');
                      if (contentEditor) {
                        const headerOffset = 80; // Adjust this value based on your header height
                        const elementPosition = contentEditor.offsetTop;
                        const offsetPosition = elementPosition - headerOffset;
                        
                        window.scrollTo({
                          top: offsetPosition,
                          behavior: 'smooth'
                        });
                      } else {
                        // Fallback to scroll to top if content-editor not found
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }, 100);
                  }}
                  sx={{ 
                    minWidth: 150,
                    height: 48,
                    borderRadius: 3,
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    color: 'white',
                    '&:hover': {
                      borderColor: 'rgba(255, 255, 255, 0.5)',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)'
                    }
                  }}
                >
                  Preview
                </Button>
            </Box>
          </TabPanel>

          {/* Signup Tab */}
          <TabPanel value={tabValue} index={1}>
            <Box sx={{ p: 3 }}>
              <Typography variant="h5" gutterBottom>
                Signup Configuration
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Configure the signup form settings and customize the registration experience.
              </Typography>
              {/* Add signup configuration content here in the future */}
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                Signup configuration features coming soon...
              </Typography>
            </Box>
          </TabPanel>


          {/* Participation Tab */}
          <TabPanel value={tabValue} index={2}>
            <Box sx={{ p: 3 }}>
              <Typography variant="h5" gutterBottom>
                Participation Tracking
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Track attendance and participation for this outing.
              </Typography>
              {/* Add participation content here in the future */}
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                Participation tracking features coming soon...
              </Typography>
            </Box>
          </TabPanel>

          {/* Photos Tab */}
          <TabPanel value={tabValue} index={3}>
            <Box sx={{ p: 3 }}>
              <Typography variant="h5" gutterBottom>
                Photos Management
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Upload and manage photos for this outing.
              </Typography>
              {/* Add photos management content here in the future */}
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                Photo management features coming soon...
              </Typography>
            </Box>
          </TabPanel>

          {/* Reflection Tab */}
          <TabPanel value={tabValue} index={4}>
            <Box sx={{ p: 3 }}>
              <Typography variant="h5" gutterBottom>
                Outing Reflection
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Reflect on the outing experience, what went well, and areas for improvement.
              </Typography>
              {/* Add reflection content here in the future */}
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                Reflection features coming soon...
              </Typography>
            </Box>
          </TabPanel>

          {/* Preview Tab */}
          <TabPanel value={tabValue} index={5} data-testid="preview-section">
            {/* Use the reusable OutingPreview component */}
            <OutingPreview 
              outingData={outingData}
              showExportButton={true}
              isLiveView={false}
            />
          </TabPanel>
          </Paper>
        )}

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

        {/* Schedule Warning Dialog */}
        <Dialog
          open={scheduleWarningDialog.open}
          onClose={scheduleWarningDialog.onCancel}
          aria-labelledby="schedule-warning-dialog-title"
          aria-describedby="schedule-warning-dialog-description"
        >
          <DialogTitle id="schedule-warning-dialog-title" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WarningIcon color="warning" />
            Schedule Duration Change
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="schedule-warning-dialog-description">
              Reducing the duration will remove the last{' '}
              <strong>{scheduleWarningDialog.daysToLose}</strong>{' '}
              day{scheduleWarningDialog.daysToLose > 1 ? 's' : ''} from your schedule, which contain{scheduleWarningDialog.daysToLose === 1 ? 's' : ''} activities.
              <br /><br />
              <strong>This action cannot be undone.</strong> Do you want to continue?
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={scheduleWarningDialog.onCancel} 
              color="primary"
            >
              Cancel
            </Button>
            <Button 
              onClick={scheduleWarningDialog.onConfirm} 
              color="warning" 
              variant="contained"
              startIcon={<WarningIcon />}
            >
              Remove Days
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default Outing;
