import React, { useState } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert
} from '@mui/material';
import axios from 'axios';
import { format, parseISO } from 'date-fns';

const TutoringRequestListSimple = ({ requests, onRequestCancelled }) => {

  const [error, setError] = useState('');

  const teacherId = localStorage.getItem('teacherId');
  
  
  // Filter requests by date and search term as well as remove any non teacher requests
  const filteredRequests = requests.filter(request => {
    if(request.status==='cancelled'){
      return false;
    }
    // Teacher Filter by local storage. Only want their requests on bottom
    if(request.Teacher?.name?.toLowerCase() !== localStorage.getItem('teacherName').toLowerCase()){
      return false;
    }

    const [year, month, day] = request.date.split('-');
    const requestDate = new Date(year, month-1, day);
    const today = new Date();
    return requestDate == today;
  });

  
  // Helper function to show lunch periods
  const getLunchPeriods = (request) => {
    const periods = [];
    if (request.lunchA) periods.push('A');
    if (request.lunchB) periods.push('B');
    if (request.lunchC) periods.push('C');
    if (request.lunchD) periods.push('D');
    
    return periods.join(', ');
  };
  
  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      <Paper elevation={3} sx={{ p: 3 }}>

        {filteredRequests.length === 0 ? (
          <Alert severity="info">No tutoring requests found.</Alert>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Student</TableCell>
                  <TableCell>Lunch Periods</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>{request.Student?.name || 'Unknown'}</TableCell>
                    <TableCell>{getLunchPeriods(request)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
};

export default TutoringRequestListSimple;
