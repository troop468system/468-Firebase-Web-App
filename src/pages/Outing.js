import React, { useState, useRef, useEffect } from 'react';
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
  Divider,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
  Link
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  GetApp as DownloadIcon,
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
  OpenInNew as OpenInNewIcon
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import PageTitle from '../components/PageTitle';
import outingService from '../services/outingService';

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

const Outing = () => {
  const [tabValue, setTabValue] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [loading, setLoading] = useState(false);
  const previewRef = useRef();
  const [outingListExpanded, setOutingListExpanded] = useState(true);

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
    schedule: [{ date: '', time: '', activity: '', group: 'All' }],
    parking: '',
    packingList: '',
    weatherForecast: '',
    nearbyHospital: '',
    references: '',
    contacts: '',
    notes: '',
    attachments: [],
    images: [], // Uploaded images
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

  // Dialog states
  const [sicDialog, setSicDialog] = useState({ open: false, name: '', role: '' });
  const [aicDialog, setAicDialog] = useState({ open: false, name: '', role: '' });

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Load outings from Firebase on component mount
  useEffect(() => {
    loadOutings();
  }, []);

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
    // Only show public outings
    if (!outing.isPublic) return false;
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const searchableText = [
        outing.eventName,
        outing.destination,
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
  const publicOutings = sortedOutings.slice(0, displayedOutings);
  
  // Update hasMoreOutings based on available data
  useEffect(() => {
    setHasMoreOutings(displayedOutings < sortedOutings.length);
  }, [displayedOutings, sortedOutings.length]);

  const loadOutingForEdit = (outing) => {
    setCurrentOutingId(outing.id); // Set the ID for editing
    setOutingData({
      eventName: outing.eventName,
      startDateTime: outing.startDateTime,
      endDateTime: outing.endDateTime,
      startPoint: outing.startPoint || '',
      destination: outing.destination,
      mapLink: outing.mapLink || '',
      sics: outing.sics || [],
      aics: outing.aics || [],
      overview: outing.overview || '',
      schedule: outing.schedule || [{ date: '', time: '', activity: '', group: 'All' }],
      parking: outing.parking || '',
      packingList: outing.packingList || '',
      weatherForecast: outing.weatherForecast || '',
      nearbyHospital: outing.nearbyHospital || '',
      references: outing.references || '',
      contacts: outing.contacts || '',
      notes: outing.notes || '',
      attachments: outing.attachments || [],
      images: outing.images || [],
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
      schedule: [{ date: '', time: '', activity: '', group: 'All' }],
      parking: '',
      packingList: '',
      weatherForecast: '',
      nearbyHospital: '',
      references: '',
      contacts: '',
      notes: '',
      attachments: [],
      images: [],
      isPublic: true
    });
    setTabValue(0); // Switch to edit tab
  };

  const handleInputChange = (field, value) => {
    setOutingData(prev => ({
      ...prev,
      [field]: value
    }));
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

  const addSIC = () => {
    if (sicDialog.name.trim()) {
      setOutingData(prev => ({
        ...prev,
        sics: [...prev.sics, { name: sicDialog.name, role: sicDialog.role }]
      }));
      setSicDialog({ open: false, name: '', role: '' });
    }
  };

  const removeSIC = (index) => {
    setOutingData(prev => ({
      ...prev,
      sics: prev.sics.filter((_, i) => i !== index)
    }));
  };

  const addAIC = () => {
    if (aicDialog.name.trim()) {
      setOutingData(prev => ({
        ...prev,
        aics: [...prev.aics, { name: aicDialog.name, role: aicDialog.role }]
      }));
      setAicDialog({ open: false, name: '', role: '' });
    }
  };

  const removeAIC = (index) => {
    setOutingData(prev => ({
      ...prev,
      aics: prev.aics.filter((_, i) => i !== index)
    }));
  };

  const addScheduleItem = () => {
    setOutingData(prev => ({
      ...prev,
      schedule: [...prev.schedule, { date: '', time: '', activity: '', group: 'All' }]
    }));
  };

  const updateScheduleItem = (index, field, value) => {
    setOutingData(prev => ({
      ...prev,
      schedule: prev.schedule.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const removeScheduleItem = (index) => {
    if (outingData.schedule.length > 1) {
      setOutingData(prev => ({
        ...prev,
        schedule: prev.schedule.filter((_, i) => i !== index)
      }));
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (currentOutingId) {
        // Update existing outing
        await outingService.updateOuting(currentOutingId, outingData);
        setSnackbar({
          open: true,
          message: 'Outing plan updated successfully!',
          severity: 'success'
        });
      } else {
        // Create new outing
        const newOutingId = await outingService.createOuting(outingData);
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

  const exportToPDF = async () => {
    setLoading(true);
    try {
      const element = previewRef.current;
      
      // Show static map images and hide iframes for PDF generation
      const iframes = element.querySelectorAll('.map-iframe');
      const staticImages = element.querySelectorAll('.map-static-image');
      
      // Hide iframes and show static images
      iframes.forEach(iframe => {
        iframe.style.display = 'none';
      });
      
      staticImages.forEach(img => {
        img.style.display = 'block';
      });
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        ignoreElements: (element) => {
          return element.tagName === 'IFRAME';
        }
      });
      
      // Restore original display states
      iframes.forEach(iframe => {
        iframe.style.display = 'block';
      });
      
      staticImages.forEach(img => {
        img.style.display = 'none';
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`${outingData.eventName || 'Outing-Plan'}.pdf`);
      setSnackbar({
        open: true,
        message: 'PDF exported successfully!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      setSnackbar({
        open: true,
        message: 'Error exporting PDF. Please try again.',
        severity: 'error'
      });
    }
    setLoading(false);
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

  const groupScheduleByDate = () => {
    const grouped = {};
    outingData.schedule.forEach(item => {
      if (!grouped[item.date]) {
        grouped[item.date] = [];
      }
      grouped[item.date].push(item);
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
                <Grid item xs={12} md={4}>
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
                <Grid item xs={12} md={3}>
                  <DateTimePicker
                    label="Start Date From"
                    value={startDateFilter}
                    onChange={(value) => setStartDateFilter(value)}
                    renderInput={(params) => <TextField {...params} fullWidth size="small" />}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <DateTimePicker
                    label="Start Date To"
                    value={endDateFilter}
                    onChange={(value) => setEndDateFilter(value)}
                    renderInput={(params) => <TextField {...params} fullWidth size="small" />}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
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
            ) : publicOutings.length === 0 ? (
              <Typography color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                {searchQuery || startDateFilter || endDateFilter 
                  ? 'No outings match your search criteria.' 
                  : 'No public outings available. Create your first outing!'
                }
              </Typography>
            ) : (
              <>
                <TableContainer component={Paper} sx={{ maxHeight: 600, overflow: 'auto' }}>
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Outing Name</strong></TableCell>
                        <TableCell><strong>Start Date</strong></TableCell>
                        <TableCell><strong>End Date</strong></TableCell>
                        <TableCell><strong>Location with Map Link</strong></TableCell>
                        <TableCell><strong>SICs</strong></TableCell>
                        <TableCell><strong>AICs</strong></TableCell>
                        <TableCell><strong>Actions</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {publicOutings.map((outing) => (
                        <TableRow key={outing.id} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2" fontWeight="medium">
                                {outing.eventName}
                              </Typography>
                              <Chip 
                                icon={<VisibilityIcon />} 
                                label="Public" 
                                size="small" 
                                color="success" 
                                variant="outlined"
                              />
                            </Box>
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
                            <Box>
                              <Typography variant="body2">
                                {outing.destination || 'Not specified'}
                              </Typography>
                              {outing.mapLink && (
                                <Link
                                  href={outing.mapLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}
                                >
                                  <OpenInNewIcon fontSize="small" />
                                  <Typography variant="caption">View Map</Typography>
                                </Link>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {outing.sics?.length > 0 
                                ? outing.sics.map(sic => sic.name).join(', ')
                                : 'None assigned'
                              }
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {outing.aics?.length > 0 
                                ? outing.aics.map(aic => aic.name).join(', ')
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
                              <Tooltip title="Preview/Export">
                                <IconButton 
                                  size="small"
                                  onClick={() => {
                                    loadOutingForEdit(outing);
                                    setTabValue(1);
                                  }}
                                  color="secondary"
                                >
                                  <PreviewIcon fontSize="small" />
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
            <Grid container spacing={3}>
              {/* Basic Information */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="h6" gutterBottom>
                    Basic Information
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={outingData.isPublic}
                          onChange={(e) => handleInputChange('isPublic', e.target.checked)}
                          color="primary"
                        />
                      }
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {outingData.isPublic ? <VisibilityIcon /> : <VisibilityOffIcon />}
                          <Typography>
                            {outingData.isPublic ? 'Public' : 'Private'}
                          </Typography>
                        </Box>
                      }
                    />
                    <Tooltip title={outingData.isPublic ? 'Everyone can see this outing' : 'Only SICs and AICs can see this outing'}>
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                        {outingData.isPublic ? '(Visible to everyone)' : '(SICs & AICs only)'}
                      </Typography>
                    </Tooltip>
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Event Name"
                  value={outingData.eventName}
                  onChange={(e) => handleInputChange('eventName', e.target.value)}
                  required
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Start Point"
                  value={outingData.startPoint}
                  onChange={(e) => handleInputChange('startPoint', e.target.value)}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <DateTimePicker
                  label="Start Date & Time"
                  value={outingData.startDateTime}
                  onChange={(value) => handleInputChange('startDateTime', value)}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <DateTimePicker
                  label="End Date & Time"
                  value={outingData.endDateTime}
                  onChange={(value) => handleInputChange('endDateTime', value)}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Destination"
                  value={outingData.destination}
                  onChange={(e) => handleInputChange('destination', e.target.value)}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Map Embed Code"
                  value={outingData.mapLink}
                  onChange={(e) => handleInputChange('mapLink', e.target.value)}
                  placeholder="Paste Google Maps embed code here (from Google Maps → Share → Embed a map)"
                  helperText="Go to Google Maps → Search location → Share → Embed a map → Copy the full <iframe> code"
                />
              </Grid>

              {/* SICs Section */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>
                  <PeopleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Senior in Charge (Scouts)
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  {outingData.sics.map((sic, index) => (
                    <Chip
                      key={index}
                      label={`${sic.name} (${sic.role})`}
                      onDelete={() => removeSIC(index)}
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                  <Chip
                    icon={<AddIcon />}
                    label="Add SIC"
                    onClick={() => setSicDialog({ open: true, name: '', role: '' })}
                    color="primary"
                    clickable
                  />
                </Box>
              </Grid>

              {/* AICs Section */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Adult in Charge
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  {outingData.aics.map((aic, index) => (
                    <Chip
                      key={index}
                      label={`${aic.name} (${aic.role})`}
                      onDelete={() => removeAIC(index)}
                      color="secondary"
                      variant="outlined"
                    />
                  ))}
                  <Chip
                    icon={<AddIcon />}
                    label="Add AIC"
                    onClick={() => setAicDialog({ open: true, name: '', role: '' })}
                    color="secondary"
                    clickable
                  />
                </Box>
              </Grid>

              {/* Overview */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Overview"
                  value={outingData.overview}
                  onChange={(e) => handleInputChange('overview', e.target.value)}
                  placeholder="Describe the purpose and goals of this outing..."
                />
              </Grid>

              {/* Schedule */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Schedule
                </Typography>
                {outingData.schedule.map((item, index) => (
                  <Card key={index} sx={{ mb: 2 }}>
                    <CardContent>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={2}>
                          <TextField
                            fullWidth
                            label="Date"
                            type="date"
                            value={item.date}
                            onChange={(e) => updateScheduleItem(index, 'date', e.target.value)}
                            InputLabelProps={{ shrink: true }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={2}>
                          <TextField
                            fullWidth
                            label="Time"
                            type="time"
                            value={item.time}
                            onChange={(e) => updateScheduleItem(index, 'time', e.target.value)}
                            InputLabelProps={{ shrink: true }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <TextField
                            fullWidth
                            label="Activity"
                            value={item.activity}
                            onChange={(e) => updateScheduleItem(index, 'activity', e.target.value)}
                          />
                        </Grid>
                        <Grid item xs={12} sm={2}>
                          <FormControl fullWidth>
                            <InputLabel>Group</InputLabel>
                            <Select
                              value={item.group}
                              label="Group"
                              onChange={(e) => updateScheduleItem(index, 'group', e.target.value)}
                            >
                              <MenuItem value="All">All</MenuItem>
                              <MenuItem value="Eagles">Eagles</MenuItem>
                              <MenuItem value="Hawks">Hawks</MenuItem>
                              <MenuItem value="Dragons">Dragons</MenuItem>
                              <MenuItem value="Leaders">Leaders</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={2}>
                          <IconButton
                            onClick={() => removeScheduleItem(index)}
                            disabled={outingData.schedule.length === 1}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                ))}
                <Button
                  startIcon={<AddIcon />}
                  onClick={addScheduleItem}
                  variant="outlined"
                  sx={{ mb: 2 }}
                >
                  Add Schedule Item
                </Button>
              </Grid>

              {/* Additional Information */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Additional Information
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Parking"
                  value={outingData.parking}
                  onChange={(e) => handleInputChange('parking', e.target.value)}
                  placeholder="Parking instructions and location..."
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Packing List"
                  value={outingData.packingList}
                  onChange={(e) => handleInputChange('packingList', e.target.value)}
                  placeholder="Items to bring, clothing recommendations..."
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Weather Forecast"
                  value={outingData.weatherForecast}
                  onChange={(e) => handleInputChange('weatherForecast', e.target.value)}
                  placeholder="Expected weather conditions..."
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Nearby Hospital"
                  value={outingData.nearbyHospital}
                  onChange={(e) => handleInputChange('nearbyHospital', e.target.value)}
                  placeholder="Emergency medical facilities nearby..."
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="References"
                  value={outingData.references}
                  onChange={(e) => handleInputChange('references', e.target.value)}
                  placeholder="Websites, guides, or other references..."
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Contacts"
                  value={outingData.contacts}
                  onChange={(e) => handleInputChange('contacts', e.target.value)}
                  placeholder="Emergency contacts, facility contacts..."
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Notes"
                  value={outingData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Additional notes, special instructions..."
                />
              </Grid>

              {/* Image Upload Section */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  📸 Outing Images
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
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
              </Grid>

              {/* Submit Button */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleSubmit}
                    disabled={loading || !outingData.eventName}
                    sx={{ minWidth: 200 }}
                  >
                    {loading 
                      ? (currentOutingId ? 'Updating...' : 'Saving...') 
                      : (currentOutingId ? 'Update Outing Plan' : 'Save Outing Plan')
                    }
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Preview Tab */}
          <TabPanel value={tabValue} index={1}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
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

            <Paper 
              ref={previewRef}
              sx={{ 
                backgroundColor: '#fff',
                minHeight: '800px',
                boxShadow: 'none',
                borderRadius: 0,
                overflow: 'hidden'
              }}
            >
              {/* Bold Hero Section with Large Image */}
              <Box sx={{ 
                position: 'relative',
                height: '100vh',
                minHeight: '600px',
                backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.6)), url(${getDisplayImages()[0]?.url})`,
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
                      textTransform: 'uppercase',
                      color: '#aac5ff'
                    }}
                  >
                    {outingData.eventName || 'SCOUT ADVENTURE'}
                  </Typography>
                  
                  <Typography 
                    variant="h3" 
                    sx={{ 
                      fontWeight: 300,
                      opacity: 0.9,
                      mb: 4,
                      maxWidth: 800,
                      mx: 'auto',
                      color: '#9bd6f3'
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
                </Box>

                {/* Leadership Box - Lower Right Corner */}
                {((outingData.sics && outingData.sics.length > 0) || (outingData.aics && outingData.aics.length > 0)) && (
                  <Box sx={{ 
                    position: 'absolute', 
                    bottom: '40px', 
                    right: '40px',
                    backgroundColor: 'rgba(90, 90, 90, 0.3)',
                    WebkitBackdropFilter: 'blur(3px)',
                    backdropFilter: 'blur(3px)',
                    borderRadius: '5px',
                    padding: '24px',
                    minWidth: '250px',
                    boxShadow: 'black 0 0 30px 0px',
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

              {/* Project Overview Quote Section */}
              <Box sx={{ 
                py: 8, 
                px: 4, 
                textAlign: 'center',
                backgroundColor: '#f8f9fa',
                position: 'relative'
              }}>
                <Typography 
                  variant="h4" 
                  sx={{ 
                    fontWeight: 300,
                    fontStyle: 'italic',
                    color: '#2c3e50',
                    maxWidth: 800,
                    mx: 'auto',
                    lineHeight: 1.6,
                    mb: 2
                  }}
                >
                  "{outingData.overview || 'Adventure changes you. As you explore new places and try new things, you discover parts of yourself you never knew existed. Each journey leaves its mark.'}"
                </Typography>
                <Typography variant="body1" sx={{ color: '#6c757d', fontWeight: 500 }}>
                  — Outing Crews
                </Typography>
              </Box>


              <Box sx={{ px: 4 }}>
                {/* Event Details Hero Card */}
                <Card sx={{ 
                  mb: 4, 
                  borderRadius: 3,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                  border: '1px solid rgba(0,0,0,0.05)'
                }}>
                  <CardContent sx={{ p: 4 }}>
                    <Grid container spacing={4}>
                      <Grid item xs={12} md={8}>
                        <Typography variant="h4" gutterBottom sx={{ color: '#2c3e50', fontWeight: 600 }}>
                          Adventure Details
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ 
                              width: 48, 
                              height: 48, 
                              borderRadius: '50%', 
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white'
                            }}>
                              📅
                            </Box>
                            <Box>
                              <Typography variant="body2" color="textSecondary">Duration</Typography>
                              <Typography variant="h6" sx={{ fontWeight: 500 }}>
                                {formatDateTime(outingData.startDateTime)} - {formatDateTime(outingData.endDateTime)}
                              </Typography>
                            </Box>
                          </Box>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ 
                              width: 48, 
                              height: 48, 
                              borderRadius: '50%', 
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white'
                            }}>
                              📍
                            </Box>
                            <Box>
                              <Typography variant="body2" color="textSecondary">Destination</Typography>
                              <Typography variant="h6" sx={{ fontWeight: 500 }}>
                                {outingData.destination || 'Adventure Awaits'}
                              </Typography>
                              {outingData.startPoint && (
                                <Typography variant="body2" color="textSecondary">
                                  Starting from: {outingData.startPoint}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </Box>
                      </Grid>
                      
                      <Grid item xs={12} md={4}>
                        <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50', fontWeight: 600 }}>
                          Leadership Team
                        </Typography>
                        
                        {outingData.sics?.length > 0 && (
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 600 }}>
                              Senior in Charge (Scouts)
                            </Typography>
                            {outingData.sics.map((sic, index) => (
                              <Typography key={index} variant="body2" sx={{ ml: 1 }}>
                                • {sic.name} ({sic.role})
                              </Typography>
                            ))}
                          </Box>
                        )}
                        
                        {outingData.aics?.length > 0 && (
                          <Box>
                            <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 600 }}>
                              Adult in Charge
                            </Typography>
                            {outingData.aics.map((aic, index) => (
                              <Typography key={index} variant="body2" sx={{ ml: 1 }}>
                                • {aic.name} ({aic.role})
                              </Typography>
                            ))}
                          </Box>
                        )}
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* Map Section */}
                {outingData.mapLink && (
                  <Card sx={{ 
                    mb: 4, 
                    borderRadius: 3,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                    border: '1px solid rgba(0,0,0,0.05)',
                    overflow: 'hidden'
                  }}>
                    <CardContent sx={{ p: 0 }}>
                      <Box sx={{ p: 3, backgroundColor: '#f8f9fa' }}>
                        <Typography variant="h5" sx={{ color: '#2c3e50', fontWeight: 600 }}>
                          📍 Location & Directions
                        </Typography>
                      </Box>
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
                                gap: 2
                              }}>
                                <Typography variant="h6" color="textSecondary">
                                  No map location provided
                                </Typography>
                              </Box>
                            );
                          }

                          // Extract the embed URL from the provided iframe code or use direct embed URL
                          let embedUrl = '';
                          
                          if (mapLink.includes('<iframe')) {
                            // Extract src from iframe code
                            const srcMatch = mapLink.match(/src="([^"]+)"/);
                            if (srcMatch) {
                              embedUrl = srcMatch[1];
                            }
                          } else if (mapLink.includes('google.com/maps/embed')) {
                            // Direct embed URL
                            embedUrl = mapLink;
                          }
                          
                          // Create static map URL for PDF exports using completely free services
                          const createStaticMapUrl = (embedUrl) => {
                            if (!embedUrl) return null;
                            
                            try {
                              // Extract coordinates from embed URL
                              const coordMatch = embedUrl.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
                              if (coordMatch) {
                                const lat = parseFloat(coordMatch[1]);
                                const lng = parseFloat(coordMatch[2]);
                                const zoom = 14;
                                const width = 800;
                                const height = 450;
                                
                                // Use completely free OpenStreetMap static map service
                                // This service generates static maps from OSM data for free
                                return `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lng}&zoom=${zoom}&size=${width}x${height}&maptype=mapnik&markers=${lat},${lng},red-pushpin`;
                              }
                            } catch (error) {
                              console.warn('Could not create static map URL:', error);
                            }
                            return null;
                          };

                          const staticMapUrl = createStaticMapUrl(embedUrl);
                          
                          return (
                            <Box sx={{ height: 450, position: 'relative' }}>
                              {embedUrl ? (
                                <>
                                  {/* Interactive iframe for web view */}
                                  <iframe
                                    src={embedUrl}
                                    width="100%"
                                    height="450"
                                    style={{ border: 0 }}
                                    allowFullScreen=""
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                    className="map-iframe"
                                  />
                                  {/* Static image for PDF (hidden by default) */}
                                  {staticMapUrl && (
                                    <img
                                      src={staticMapUrl}
                                      alt="Location Map"
                                      style={{
                                        width: '100%',
                                        height: '450px',
                                        objectFit: 'cover',
                                        display: 'none'
                                      }}
                                      className="map-static-image"
                                    />
                                  )}
                                </>
                              ) : (
                                <Box sx={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  justifyContent: 'center', 
                                  height: 450,
                                  backgroundColor: '#f8f9fa',
                                  flexDirection: 'column',
                                  gap: 3,
                                  borderRadius: 2,
                                  border: '2px dashed #ddd'
                                }}>
                                  <Box sx={{ 
                                    width: 100, 
                                    height: 100, 
                                    borderRadius: '50%', 
                                    backgroundColor: '#e3f2fd',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '3rem'
                                  }}>
                                    📍
                                  </Box>
                                  <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h6" color="textPrimary" sx={{ mb: 1 }}>
                                      Add Map Location
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary" sx={{ mb: 3, maxWidth: 300 }}>
                                      To add a map, go to Google Maps → Search location → Share → Embed a map → Copy the embed code and paste it in the Map Link field
                                    </Typography>
                                  </Box>
                                </Box>
                              )}
                            </Box>
                          );
                        })()}
                      </Box>
                    </CardContent>
                  </Card>
                )}

                {/* Overview Section */}
                {outingData.overview && (
                  <Box sx={{ 
                    py: 8, 
                    px: 4, 
                    backgroundColor: '#f8f9fa',
                    mb: 4
                  }}>
                    <Typography 
                      variant="h4" 
                      sx={{ 
                        fontWeight: 300,
                        fontStyle: 'italic',
                        color: '#2c3e50',
                        maxWidth: 800,
                        mx: 'auto',
                        lineHeight: 1.6,
                        mb: 2,
                        whiteSpace: 'pre-wrap',
                        fontSize: '1.5rem',
                        textAlign: 'left'
                      }}
                    >
                      "{outingData.overview}"
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#6c757d', fontWeight: 500, maxWidth: 800, mx: 'auto', textAlign: 'right' }}>
                      — Outing Crews
                    </Typography>
                  </Box>
                )}

                {/* Schedule Section */}
                <Card sx={{ 
                  mb: 4, 
                  borderRadius: 3,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                  border: '1px solid rgba(0,0,0,0.05)'
                }}>
                  <CardContent sx={{ p: 4 }}>
                    <Typography variant="h5" gutterBottom sx={{ color: '#2c3e50', fontWeight: 600, mb: 3 }}>
                      ⏰ Adventure Schedule
                    </Typography>
                    {Object.entries(groupScheduleByDate()).map(([date, items]) => (
                      <Box key={date} sx={{ mb: 3 }}>
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white', 
                            p: 2, 
                            borderRadius: 2,
                            fontWeight: 500
                          }}
                        >
                          {date ? new Date(date).toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          }) : 'Date To Be Determined'}
                        </Typography>
                        {items.map((item, index) => (
                          <Box 
                            key={index} 
                            sx={{ 
                              display: 'flex', 
                              p: 2, 
                              borderBottom: index < items.length - 1 ? '1px solid #eee' : 'none',
                              backgroundColor: index % 2 === 0 ? '#f8f9fa' : 'white',
                              alignItems: 'center'
                            }}
                          >
                            <Typography sx={{ 
                              minWidth: 100, 
                              fontWeight: 600,
                              color: '#667eea',
                              fontSize: '1.1rem'
                            }}>
                              {item.time || 'TBD'}
                            </Typography>
                            <Typography sx={{ 
                              flex: 1, 
                              mx: 2,
                              fontSize: '1.1rem'
                            }}>
                              {item.activity}
                            </Typography>
                            <Chip 
                              label={item.group}
                              size="small"
                              sx={{ 
                                backgroundColor: '#e3f2fd',
                                color: '#1976d2',
                                fontWeight: 500
                              }}
                            />
                          </Box>
                        ))}
                      </Box>
                    ))}
                  </CardContent>
                </Card>

                {/* Additional Information Grid */}
                <Grid container spacing={3}>
                  {[
                    { key: 'parking', title: '🚗 Parking Information', data: outingData.parking },
                    { key: 'packingList', title: '🎒 Packing List', data: outingData.packingList },
                    { key: 'weatherForecast', title: '🌤️ Weather Forecast', data: outingData.weatherForecast },
                    { key: 'nearbyHospital', title: '🏥 Emergency Medical', data: outingData.nearbyHospital },
                    { key: 'references', title: '📚 References & Resources', data: outingData.references },
                    { key: 'contacts', title: '📞 Important Contacts', data: outingData.contacts }
                  ].filter(item => item.data).map((item) => (
                    <Grid item xs={12} md={6} key={item.key}>
                      <Card sx={{ 
                        height: '100%',
                        borderRadius: 3,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                        border: '1px solid rgba(0,0,0,0.05)',
                        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 8px 30px rgba(0,0,0,0.12)'
                        }
                      }}>
                        <CardContent sx={{ p: 3 }}>
                          <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50', fontWeight: 600 }}>
                            {item.title}
                          </Typography>
                          <Typography 
                            variant="body1" 
                            sx={{ 
                              whiteSpace: 'pre-wrap', 
                              lineHeight: 1.6,
                              color: '#555'
                            }}
                          >
                            {item.data}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}

                  {outingData.notes && (
                    <Grid item xs={12}>
                      <Card sx={{ 
                        borderRadius: 3,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                        border: '1px solid rgba(0,0,0,0.05)'
                      }}>
                        <CardContent sx={{ p: 4 }}>
                          <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50', fontWeight: 600 }}>
                            📝 Additional Notes
                          </Typography>
                          <Typography 
                            variant="body1" 
                            sx={{ 
                              whiteSpace: 'pre-wrap', 
                              lineHeight: 1.6,
                              color: '#555',
                              fontSize: '1.1rem'
                            }}
                          >
                            {outingData.notes}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  )}
                </Grid>


                {/* Footer */}
                <Box sx={{ 
                  mt: 8, 
                  pt: 6, 
                  borderTop: '1px solid #e9ecef',
                  textAlign: 'center',
                  backgroundColor: '#f8f9fa'
                }}>
                  <Typography variant="body1" sx={{ color: '#6c757d', fontWeight: 400 }}>
                    Generated on {new Date().toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </Typography>
                  <Typography variant="h6" sx={{ color: '#2c3e50', fontWeight: 700, mt: 1 }}>
                    BOY SCOUT TROOP 468
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#6c757d', mt: 1 }}>
                    Adventure • Character • Leadership
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </TabPanel>
        </Paper>

        {/* SIC Dialog */}
        <Dialog open={sicDialog.open} onClose={() => setSicDialog({ open: false, name: '', role: '' })}>
          <DialogTitle>Add Senior in Charge (Scout)</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Scout Name"
              fullWidth
              variant="outlined"
              value={sicDialog.name}
              onChange={(e) => setSicDialog(prev => ({ ...prev, name: e.target.value }))}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="Role/Position"
              fullWidth
              variant="outlined"
              value={sicDialog.role}
              onChange={(e) => setSicDialog(prev => ({ ...prev, role: e.target.value }))}
              placeholder="e.g., Patrol Leader, SPL, ASPL"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSicDialog({ open: false, name: '', role: '' })}>Cancel</Button>
            <Button onClick={addSIC} variant="contained">Add</Button>
          </DialogActions>
        </Dialog>

        {/* AIC Dialog */}
        <Dialog open={aicDialog.open} onClose={() => setAicDialog({ open: false, name: '', role: '' })}>
          <DialogTitle>Add Adult in Charge</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Adult Name"
              fullWidth
              variant="outlined"
              value={aicDialog.name}
              onChange={(e) => setAicDialog(prev => ({ ...prev, name: e.target.value }))}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="Role/Position"
              fullWidth
              variant="outlined"
              value={aicDialog.role}
              onChange={(e) => setAicDialog(prev => ({ ...prev, role: e.target.value }))}
              placeholder="e.g., Scoutmaster, Assistant Scoutmaster, Parent"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAicDialog({ open: false, name: '', role: '' })}>Cancel</Button>
            <Button onClick={addAIC} variant="contained">Add</Button>
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