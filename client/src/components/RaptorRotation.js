// Update src/components/Dashboard.js
import React, { useEffect } from 'react';
import { Box, Typography, Alert, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import TutoringRequestListSimple from './TutoringRequestListSimple';
import RaptorRotationEvents from './RaptorRotationEvents';
import { useTutoring } from '../contexts/TutoringContext';
import { useAuth } from '../contexts/AuthContext';

const RaptorRotation = () => {
  const navigate = useNavigate();
  const { loading, error} = useTutoring();
  const { currentUser, authLoading } = useAuth();

  useEffect(() => {
    // Wait for the session to resolve before deciding. Reading localStorage
    // directly used to bounce a signed-in teacher to the login page whenever
    // they opened /dashboard straight from a URL, because AuthProvider hadn't
    // written the id yet.
    if (authLoading) return;
    if (!currentUser) {
      navigate('/select-teacher', { replace: true });
    }
  }, [authLoading, currentUser, navigate]);


  if (authLoading || loading) {
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

