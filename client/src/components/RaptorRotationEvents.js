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
import {useTutoring } from '../contexts/TutoringContext';

const RaptorRotationEvents = () => {
  const {sessions, loading, error } = useTutoring();

  //RRs point to one main teacher so these are groups. 
  //Doesn't change local storage just for this component maps to the "main" teacher
  const getRRMainTeacherID = (teacherId) => {
    const RR_GROUPS = {
      '10038':'10026',
      '10036':'10026',
      '10006':'10015',
      '10003':'10015',
      '10010':'10032',
      '10027':'10032',
      '10037':'10018',
      '10014':'10018',
      '10031':'10002',
      '10011':'10002'
    };
    return RR_GROUPS[teacherId] || teacherId;
  };

  const teacherId = getRRMainTeacherID(localStorage.getItem('teacherId'));
 
  // Get today's requests for RR teacher
  const todaysRequests = sessions.filter(request => {
    if(request.status === 'cancelled') return false;
    const requestDate = new Date(request.date + 'T00:00:00');
    const today = new Date();

    const isToday = 
      (
        requestDate.getFullYear() === today.getFullYear() &&
        requestDate.getMonth() === today.getMonth() &&
        requestDate.getDate() === today.getDate()
      );
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
  const getFullName = (person) => {
    if(!person?.first_name || !person?.last_name) return 'Unknown';
    return `${person.first_name} ${person.last_name}`;
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
                    <TableCell>{getFullName(request.Student)}</TableCell>
                    <TableCell>{getFullName(request.Teacher)}</TableCell>
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
