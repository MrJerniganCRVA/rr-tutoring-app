// Update src/components/Dashboard.js
import React, { useState, useEffect } from 'react';
import { Box, Typography, Alert, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import TutoringRequestListSimple from './TutoringRequestListSimple';
import axios from 'axios';
import RaptorRotationEvents from './RaptorRotationEvents';

const RaptorRotation = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [requests, setRequests] = useState([]);
  const navigate = useNavigate();
  
  useEffect(() => {
    // Check if user is logged in
    const teacherId = localStorage.getItem('teacherId');
    if (!teacherId) {
      navigate('/select-teacher');
      return;
    }
    
    // Fetch tutoring requests
    const fetchRequests = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:5000/api/tutoring');
        setRequests(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching requests:', err);
        setError('Failed to load tutoring requests. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchRequests();
  }, [navigate]);
  
  const handleRequestCancelled = (requestId) => {
    setRequests(
      requests.map(request => 
        request.id === requestId 
          ? { ...request, status: 'cancelled' } 
          : request
      )
    );
  };
  
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

      <RaptorRotationEvents 
        requests={requests} 
      />
      <Typography variant="h4" component="h1" gutterBottom>
        Coming For Tutoring
      </Typography>
      <TutoringRequestListSimple
        requests={requests}
      />
    </Box>
  );
};

export default RaptorRotation;

