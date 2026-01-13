// Update src/components/Dashboard.js
import React, { useEffect } from 'react';
import { Box, Typography, Alert, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import TutoringRequestListSimple from './TutoringRequestListSimple';
import RaptorRotationEvents from './RaptorRotationEvents';
import { useTutoring } from '../contexts/TutoringContext';

const RaptorRotation = () => {
  const navigate = useNavigate();
  const { loading, error} = useTutoring();
  
  useEffect(() => {
    // Check if user is logged in
    const teacherId = localStorage.getItem('teacherId');
    if (!teacherId) {
      navigate('/select-teacher');
      return;
    }}, [navigate]);
  
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Leaving RR Today
      </Typography>
      
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <RaptorRotationEvents  />
      <Typography variant="h4" component="h1" gutterBottom>
        Coming For Tutoring
      </Typography>
      <TutoringRequestListSimple />
    </Box>
  );
};

export default RaptorRotation;

