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

const RaptorRotationEvents = ({ requests }) => {
  const [error, setError] = useState('');
  
  const teacherId = localStorage.getItem('teacherId');
 
  const today = new Date().toISOString().split('T')[0];

  const todaysRequests = requests.filter(request => {
    const isToday = request.date === today;
    const isRRteacher = request.Student?.RR?.id === parseInt(teacherId);
  
    return isToday && isRRteacher;
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
      
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          {todaysRequests.length>0 ?(
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Student</TableCell>
                  <TableCell>Teacher</TableCell>
                  <TableCell>Lunch Periods</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {todaysRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>{request.Student?.name || 'Unknown'}</TableCell>
                    <TableCell>{request.Teacher?.name || 'Unknown'}</TableCell>
                    <TableCell>{getLunchPeriods(request)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          ) : (
            <Alert severity="info">No one requested from your RR today!</Alert>
          )}
        </Paper>
    </Box>
  );
};

export default RaptorRotationEvents;
