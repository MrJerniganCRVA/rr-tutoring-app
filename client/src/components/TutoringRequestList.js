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
  Alert
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import axios from 'axios';
import { format, parseISO } from 'date-fns';

const TutoringRequestList = ({ requests, onRequestCancelled }) => {
  const [filterDate, setFilterDate] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [checked, setChecked] = useState(false);
  const teacherId = localStorage.getItem('teacherId');
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
  
  const handleCancelRequest = async (requestId) => {
    try {
      await axios.put(
        `${API_BASE_URL}/api/tutoring/cancel/${requestId}`,
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
    return requestDate >= today;
  });
  //set check box
  const handleChange = (event, request)=>{
    setChecked(event.target.checked);
    //on request send update table
  };
  // Helper function to format date
  const formatDate = (dateString) => {
    return format(parseISO(dateString), 'MMM dd, yyyy');
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
