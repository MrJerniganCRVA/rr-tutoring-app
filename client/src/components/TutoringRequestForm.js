import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Alert,
  CircularProgress
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import apiService from '../utils/apiService';

const TutoringRequestForm = ({ onRequestAdded }) => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [lunches, setLunches] = useState({
    A: false,
    B: false,
    C: false,
    D: false
  });
  
  const [loading, setLoading] = useState(false);
  const [fetchingStudents, setFetchingStudents] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Get the logged in teacher
  const teacherId = localStorage.getItem('teacherId');
  
  useEffect(() => {
    // Fetch students
    const fetchStudents = async () => {
      try {
        setFetchingStudents(true);
        const response = await apiService.getStudents();
        const filteredStudents = response.data.filter(student =>{
          console.log(parseInt(teacherId));
          return(
            student?.R1Id===parseInt(teacherId) ||
            student?.R2Id===parseInt(teacherId) ||
            student?.R4Id===parseInt(teacherId) ||
            student?.R5Id===parseInt(teacherId)
          );
        });
        setStudents(filteredStudents);
        setFetchingStudents(false);
      } catch (err) {
        console.error('Error fetching students:', err);
        setError(apiService.formatError(err));
        setFetchingStudents(false);
      }
    };
    
    fetchStudents();
  }, []);
  
  const handleLunchChange = (event) => {
    setLunches({
      ...lunches,
      [event.target.name]: event.target.checked
    });
  };
  
  const handleSubmit = async (event) => {
    event.preventDefault();
    
    // Reset messages
    setError('');
    setSuccess('');
    
    // Validate form
    if (!selectedStudent) {
      setError('Please select a student');
      return;
    }
    
    if (!selectedDate) {
      setError('Please select a date');
      return;
    }
    
    const anyLunchSelected = Object.values(lunches).some(val => val);
    if (!anyLunchSelected) {
      setError('Please select at least one lunch period');
      return;
    }
    
    // Submit request
    try {
      setLoading(true);
      
      const response = await apiService.createTutoringRequest({
        studentId: selectedStudent,
        date: selectedDate.toISOString().split('T')[0],
        lunches
      });
      
      setSuccess('Student successfully requested for tutoring');
      
      // Reset form
      setSelectedStudent('');
      setSelectedDate(null);
      setLunches({
        A: false,
        B: false,
        C: false,
        D: false
      });
      
      // Notify parent component
      if (onRequestAdded) {
        onRequestAdded(response.data);
      }
      
    } catch (err) {
      console.error('Error creating tutoring request:', err);
      
      // Handle conflict details if available
      if (err.response && err.response.data && err.response.data.conflicts) {
        setError(`${err.response.data.msg}. ${err.response.data.conflicts[0].message || ''}`);
      } else {
        setError(apiService.formatError(err));
      }
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        Request a Student for Tutoring
      </Typography>
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      
      <Box component="form" onSubmit={handleSubmit}>
        <FormControl fullWidth margin="normal">
          <InputLabel id="student-select-label">Student</InputLabel>
          <Select
            labelId="student-select-label"
            value={selectedStudent}
            label="Student"
            onChange={(e) => setSelectedStudent(e.target.value)}
            disabled={fetchingStudents || loading}
          >
            {fetchingStudents ? (
              <MenuItem disabled>Loading students...</MenuItem>
            ) : students.length === 0 ? (
              <MenuItem disabled>No students available</MenuItem>
            ) : (
              students.map((student) => (
                <MenuItem key={student.id} value={student.id}>
                  {student.name}
                </MenuItem>
              ))
            )}
          </Select>
        </FormControl>
        
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DatePicker
            label="Date"
            value={selectedDate}
            onChange={setSelectedDate}
            renderInput={(params) => (
              <TextField {...params} fullWidth margin="normal" />
            )}
            disabled={loading}
            minDate={new Date()} // Can't request dates in the past
          />
        </LocalizationProvider>
        
        <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
          Select Lunch Periods:
        </Typography>
        
        <FormGroup>
          <FormControlLabel 
            control={
              <Checkbox 
                checked={lunches.A} 
                onChange={handleLunchChange} 
                name="A" 
                disabled={loading}
              />
            } 
            label="Lunch A" 
          />
          <FormControlLabel 
            control={
              <Checkbox 
                checked={lunches.B} 
                onChange={handleLunchChange} 
                name="B" 
                disabled={loading}
              />
            } 
            label="Lunch B" 
          />
          <FormControlLabel 
            control={
              <Checkbox 
                checked={lunches.C} 
                onChange={handleLunchChange} 
                name="C" 
                disabled={loading}
              />
            } 
            label="Lunch C" 
          />
          <FormControlLabel 
            control={
              <Checkbox 
                checked={lunches.D} 
                onChange={handleLunchChange} 
                name="D" 
                disabled={loading}
              />
            } 
            label="Lunch D" 
          />
        </FormGroup>
        
        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          sx={{ mt: 3 }}
          disabled={loading || fetchingStudents}
        >
          {loading ? <CircularProgress size={24} /> : 'Submit Request'}
        </Button>
      </Box>
    </Paper>
  );
};

export default TutoringRequestForm;
