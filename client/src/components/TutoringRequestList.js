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
import {useTutoring} from '../contexts/TutoringContext';

const TutoringRequestList = () => {
  const [filterDate, setFilterDate] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const teacherId = localStorage.getItem('teacherId');
  const {sessions, error, cancelSession} = useTutoring();
  const getFullName = (person) => {
    if (!person?.first_name || !person?.last_name) return '';
    return `${person.first_name} ${person.last_name}`;
  };
  const handleCancelRequest = async (requestId) => {
    cancelSession(requestId);
  };
  
  // Filter requests by date and search term as well as remove any non teacher requests
  const filteredRequests = sessions.filter(request => {
    if(request.status==='cancelled'){
      return false;
    }

    const requestTeacherName = getFullName(request.Teacher).toLowerCase();
    const currentTeacherName = (localStorage.getItem('teacherName') || '').toLowerCase();

    if(requestTeacherName !== currentTeacherName){
      return false;
    }

    if (filterDate) {
      const selectedDate = filterDate.toISOString().split('T')[0];
      if (request.date !== selectedDate)
      {
        return false;
      }
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const studentName = getFullName(request.Student).toLowerCase();
      return studentName.includes(term);
    }

    if(!filterDate && !searchTerm){
      const today = new Date().toISOString().split('T')[0];
      return request.date >= today;
    }

    return true;
  });

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
                    <TableCell>{getFullName(request.Student) || 'Unknown'}</TableCell>
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
