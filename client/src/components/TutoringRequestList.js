import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  TextField,
  InputAdornment,
  Alert,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  Search as SearchIcon,
  Cancel as CancelIcon 
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import axios from 'axios';
import { format } from 'date-fns';

const TutoringRequestList = ({ requests, onRequestCancelled }) => {
  const [filterDate, setFilterDate] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  
  const teacherId = localStorage.getItem('teacherId');
  
  const handleCancelRequest = async (requestId) => {
    try {
      await axios.put(
        `http://localhost:5000/api/tutoring/cancel/${requestId}`,
        {},
        {
          headers: {
            'x-teacher-id': teacherId
          }
        }
      );
      
      if (onRequestCancelled) {
        onRequestCancelled(requestId);
      }
    } catch (err) {
      console.error('Error cancelling request:', err);
      setError('Failed to cancel the request. Please try again.');
    }
  };
  
  // Filter requests by date and search term as well as remove any non RR teacher requests
  const filteredRequests = requests.filter(request => {
    // Teacher Filter by local storage
    if(request.Teacher?.name?.toLowerCase() !== localStorage.getItem('teacherName').toLowerCase()){
      return false;
    }
    const requestDate = new Date(request.date);
    // Specific Date filter
    if (filterDate) {
      const selectedDate = new Date(filterDate);
      
      if (
        requestDate.getFullYear() !== selectedDate.getFullYear() ||
        requestDate.getMonth() !== selectedDate.getMonth() ||
        requestDate.getDate() !== selectedDate.getDate()
      ) {
        return false;
      }
    }
    // Search filter (student name)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const studentName = request.Student?.name?.toLowerCase() || '';
      return studentName.includes(term);
    }
    //If no specific date or student then only future dates
    const today = new Date();
    today.setHours(0,0,0,0);
    requestDate.setHours(0,0,0,0);
    
    return requestDate >= today;
  });
  
  // Get today's requests for RR teacher
  const todaysRequests = requests.filter(request => {
    const requestDate = new Date(request.date);
    const today = new Date();
    const isToday = 
    (
      requestDate.getFullYear() === today.getFullYear() &&
      requestDate.getMonth() === today.getMonth() &&
      requestDate.getDate() === today.getDate() &&
      request.status === 'active'
    );

    const teacherId = localStorage.getItem('teacherId');
    const isRRteacher = request.Student?.teachers?.RR?.id ===parseInt(teacherId);

    return isToday && isRRteacher;
  });
  
  // Helper function to format date
  const formatDate = (dateString) => {
    return format(new Date(dateString), 'MMM dd, yyyy');
  };
  
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
          <Typography variant="h6" gutterBottom>
            RR Tutoring Sessions for Today
          </Typography>
          {todaysRequests.length>0 ?(
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Student</TableCell>
                  <TableCell>Teacher</TableCell>
                  <TableCell>Lunch Periods</TableCell>
                  <TableCell align="right">Actions</TableCell>
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
            <Alert severity="info">No tutoring requests today!</Alert>
          )}
        </Paper>
      
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          Tutoring Requests by {localStorage.getItem('teacherName')}
        </Typography>
        
        <Box sx={{ display: 'flex', mb: 3, gap: 2 }}>
          <TextField
            label="Search by name"
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ flexGrow: 1 }}
          />
          
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Filter by date"
              value={filterDate}
              onChange={setFilterDate}
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  size="small" 
                  sx={{ width: 180 }}
                />
              )}
            />
          </LocalizationProvider>
          
          <Button 
            variant="outlined" 
            onClick={() => {
              setFilterDate(null);
              setSearchTerm('');
            }}
          >
            Clear Filters
          </Button>
        </Box>
        
        {filteredRequests.length === 0 ? (
          <Alert severity="info">No tutoring requests found.</Alert>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Student</TableCell>
                  <TableCell>Lunch Periods</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>{formatDate(request.date)}</TableCell>
                    <TableCell>{request.Student?.name || 'Unknown'}</TableCell>
                    <TableCell>{getLunchPeriods(request)}</TableCell>
                    <TableCell>
                      <Chip 
                        label={request.status} 
                        color={request.status === 'active' ? 'success' : 'default'} 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell align="right">
                      {request.status === 'active' && 
                       request.Teacher?.id === parseInt(teacherId) && (
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          onClick={() => handleCancelRequest(request.id)}
                        >
                          Cancel
                        </Button>
                      )}
                    </TableCell>
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

export default TutoringRequestList;
