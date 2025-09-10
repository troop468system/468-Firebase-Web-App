import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Box, CircularProgress, Alert } from '@mui/material';
import OutingPreview from './OutingPreview';
import outingService from '../services/outingService';

const OutingLiveView = () => {
  const { eventId } = useParams();
  const [outingData, setOutingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Clean HTML content
  const cleanHtmlContent = (html) => {
    if (!html || html.trim() === '') return html;
    return html.trim();
  };

  // Load specific outing for live view
  const loadOuting = useCallback(async (outingId) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Loading outing for live view:', outingId);
      const outingData = await outingService.getOuting(outingId);
      
      if (outingData) {
        console.log('Loaded outing data:', outingData);
        
        // Clean HTML content
        const cleanedData = { ...outingData };
        if (cleanedData.overview) cleanedData.overview = cleanHtmlContent(cleanedData.overview);
        if (cleanedData.detail) cleanedData.detail = cleanHtmlContent(cleanedData.detail);
        if (cleanedData.packingList) cleanedData.packingList = cleanHtmlContent(cleanedData.packingList);
        if (cleanedData.parking) cleanedData.parking = cleanHtmlContent(cleanedData.parking);
        if (cleanedData.nearbyHospital) cleanedData.nearbyHospital = cleanHtmlContent(cleanedData.nearbyHospital);
        if (cleanedData.notes) cleanedData.notes = cleanHtmlContent(cleanedData.notes);
        if (cleanedData.contacts) cleanedData.contacts = cleanHtmlContent(cleanedData.contacts);
        if (cleanedData.references) cleanedData.references = cleanHtmlContent(cleanedData.references);
        if (cleanedData.weatherForecast) cleanedData.weatherForecast = cleanHtmlContent(cleanedData.weatherForecast);
        
        setOutingData(cleanedData);
      } else {
        setError('Outing not found');
      }
    } catch (error) {
      console.error('Error loading outing:', error);
      setError('Error loading outing: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (eventId) {
      loadOuting(eventId);
    } else {
      setError('No event ID provided');
      setLoading(false);
    }
  }, [eventId, loadOuting]);

  if (loading) {
    return (
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '100vh',
          backgroundColor: '#fff'
        }}>
          <CircularProgress size={60} />
        </Box>
      </LocalizationProvider>
    );
  }

  if (error) {
    return (
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '100vh',
          backgroundColor: '#fff',
          p: 3
        }}>
          <Alert severity="error" sx={{ maxWidth: 400 }}>
            {error}
          </Alert>
        </Box>
      </LocalizationProvider>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <OutingPreview 
        outingData={outingData}
        showExportButton={true}
        isLiveView={true}
      />
    </LocalizationProvider>
  );
};

export default OutingLiveView;
