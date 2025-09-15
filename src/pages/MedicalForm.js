import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Grid,
  Alert,
  Snackbar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Divider
} from '@mui/material';
import { 
  LocalHospital as MedicalIcon,
  CloudUpload as UploadIcon,
  Description as FileIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Person as PersonIcon,
  CalendarToday as DateIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import googleDriveService from '../services/googleDriveService';

const MedicalForm = () => {
  const [user, setUser] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadDialog, setUploadDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [patientName, setPatientName] = useState('');
  const [formType, setFormType] = useState('');
  const [loading, setLoading] = useState(false);

  // Listen for authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  // Load uploaded files (this would typically come from a database)
  useEffect(() => {
    // For now, we'll use local storage to simulate file tracking
    // In a real app, you'd fetch this from your database
    const savedFiles = localStorage.getItem('medicalForms');
    if (savedFiles) {
      setUploadedFiles(JSON.parse(savedFiles));
    }
  }, []);

  // Save files to local storage (in real app, save to database)
  const saveFilesToStorage = (files) => {
    localStorage.setItem('medicalForms', JSON.stringify(files));
    setUploadedFiles(files);
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type (accept common document formats)
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/jpg',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedTypes.includes(file.type)) {
      setUploadError('Please select a PDF, Word document, or image file.');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File must be smaller than 10MB.');
      return;
    }

    setSelectedFile(file);
    setFileName(file.name);
    setUploadDialog(true);
    setUploadError(null);
  };

  const handleUpload = async () => {
    if (!selectedFile || !patientName || !formType) {
      setUploadError('Please fill in all required fields.');
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      // Create a custom filename with patient name and form type
      const timestamp = new Date().toISOString().split('T')[0];
      const customFileName = `${patientName}_${formType}_${timestamp}_${selectedFile.name}`;

      // Upload to Google Drive in Medical Form folder
      const result = await googleDriveService.uploadMedicalForm(selectedFile, customFileName);
      
      // Create file record
      const fileRecord = {
        id: Date.now().toString(),
        fileName: customFileName,
        originalName: selectedFile.name,
        patientName,
        formType,
        uploadDate: new Date().toISOString(),
        uploadedBy: user?.displayName || user?.email || 'Unknown',
        googleDriveUrl: result.url || result,
        fileSize: selectedFile.size,
        fileType: selectedFile.type
      };

      // Add to uploaded files list
      const updatedFiles = [fileRecord, ...uploadedFiles];
      saveFilesToStorage(updatedFiles);

      setUploadSuccess(true);
      setUploadDialog(false);
      resetForm();

    } catch (error) {
      console.error('Upload failed:', error);
      setUploadError(error.message || 'Failed to upload file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setFileName('');
    setPatientName('');
    setFormType('');
  };

  const handleDelete = async (fileId) => {
    if (!window.confirm('Are you sure you want to delete this medical form?')) {
      return;
    }

    setLoading(true);
    try {
      // In a real app, you'd also delete from Google Drive
      const updatedFiles = uploadedFiles.filter(file => file.id !== fileId);
      saveFilesToStorage(updatedFiles);
    } catch (error) {
      setUploadError('Failed to delete file.');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Container maxWidth="lg">
      {/* Header */}
      <Box display="flex" alignItems="center" mb={4}>
        <MedicalIcon sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h4" component="h1">
          Medical Forms
        </Typography>
      </Box>

      {/* Upload Section */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="between" alignItems="center" mb={3}>
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Upload Medical Forms
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Upload medical forms, health records, and emergency contact information to Google Drive.
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  startIcon={<UploadIcon />}
                  onClick={() => document.getElementById('file-input').click()}
                  disabled={uploading}
                >
                  Upload File
                </Button>
                <input
                  id="file-input"
                  type="file"
                  hidden
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={handleFileSelect}
                />
              </Box>

              <Typography variant="body2" color="text.secondary">
                Accepted formats: PDF, Word documents, Images (JPG, PNG) • Maximum size: 10MB
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Uploaded Files List */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Uploaded Medical Forms ({uploadedFiles.length})
              </Typography>
              
              {uploadedFiles.length === 0 ? (
                <Box textAlign="center" py={4}>
                  <FileIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="body1" color="text.secondary">
                    No medical forms uploaded yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Click "Upload File" to add your first medical form
                  </Typography>
                </Box>
              ) : (
                <List>
                  {uploadedFiles.map((file, index) => (
                    <React.Fragment key={file.id}>
                      {index > 0 && <Divider />}
                      <ListItem>
                        <ListItemIcon>
                          <FileIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography variant="body1" fontWeight="medium">
                                {file.originalName}
                              </Typography>
                              <Chip 
                                label={file.formType} 
                                size="small" 
                                color="primary" 
                                variant="outlined"
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Box display="flex" alignItems="center" gap={2} mt={1}>
                                <Box display="flex" alignItems="center" gap={0.5}>
                                  <PersonIcon fontSize="small" />
                                  <Typography variant="body2">
                                    {file.patientName}
                                  </Typography>
                                </Box>
                                <Box display="flex" alignItems="center" gap={0.5}>
                                  <DateIcon fontSize="small" />
                                  <Typography variant="body2">
                                    {formatDate(file.uploadDate)}
                                  </Typography>
                                </Box>
                                <Typography variant="body2" color="text.secondary">
                                  {formatFileSize(file.fileSize)}
                                </Typography>
                              </Box>
                              <Typography variant="body2" color="text.secondary" mt={0.5}>
                                Uploaded by: {file.uploadedBy}
                              </Typography>
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <Box display="flex" gap={1}>
                            <IconButton
                              onClick={() => window.open(file.googleDriveUrl, '_blank')}
                              size="small"
                              title="View in Google Drive"
                            >
                              <DownloadIcon />
                            </IconButton>
                            <IconButton
                              onClick={() => handleDelete(file.id)}
                              size="small"
                              color="error"
                              title="Delete"
                              disabled={loading}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </ListItemSecondaryAction>
                      </ListItem>
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Upload Dialog */}
      <Dialog open={uploadDialog} onClose={() => setUploadDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="between" alignItems="center">
            Upload Medical Form
            <IconButton onClick={() => setUploadDialog(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={3} mt={2}>
            <TextField
              fullWidth
              label="File Name"
              value={fileName}
              disabled
              variant="outlined"
              helperText="Selected file"
            />
            
            <TextField
              fullWidth
              label="Patient Name *"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              variant="outlined"
              required
              placeholder="Enter patient's full name"
            />
            
            <TextField
              fullWidth
              label="Form Type *"
              value={formType}
              onChange={(e) => setFormType(e.target.value)}
              variant="outlined"
              required
              placeholder="e.g., Health History, Medication List, Emergency Contacts"
              helperText="Describe what type of medical form this is"
            />

            {uploadError && (
              <Alert severity="error">
                {uploadError}
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialog(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            variant="contained"
            disabled={uploading || !patientName || !formType}
            startIcon={uploading ? <CircularProgress size={20} /> : <UploadIcon />}
          >
            {uploading ? 'Uploading...' : 'Upload to Google Drive'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Snackbar */}
      <Snackbar
        open={uploadSuccess}
        autoHideDuration={6000}
        onClose={() => setUploadSuccess(false)}
      >
        <Alert onClose={() => setUploadSuccess(false)} severity="success">
          Medical form uploaded successfully to Google Drive!
        </Alert>
      </Snackbar>

      {/* Error Snackbar */}
      <Snackbar
        open={!!uploadError}
        autoHideDuration={6000}
        onClose={() => setUploadError(null)}
      >
        <Alert onClose={() => setUploadError(null)} severity="error">
          {uploadError}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default MedicalForm;
