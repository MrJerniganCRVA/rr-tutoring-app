import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  FormGroup,
  FormControlLabel,
  Autocomplete,
  Checkbox,
  Alert,
  CircularProgress,
  Chip
} from '@mui/material';
//import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import apiService from '../utils/apiService';
import PriorityDatePicker from './PriorityDatePicker.js';
import {useTutoring} from '../contexts/TutoringContext.js';

const TutoringRequestForm = () => {
  const { createSession } = useTutoring();
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [studentLunchPeriod, setStudentLunchPeriod] = useState(null);
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
          return(
            student?.R1Id===parseInt(teacherId) ||
            student?.R2Id===parseInt(teacherId) ||
            student?.R4Id===parseInt(teacherId) ||
            student?.R5Id===parseInt(teacherId)
          );
        });
        const filteredStudentNames = filteredStudents.map(student =>{
          student.name = student.lunch ? `[${student.lunch}] ${student.name}` : `N ${student.name}`;
          return student;
        });
        setStudents(filteredStudentNames);
        setFetchingStudents(false);
      } catch (err) {
        console.error('Error fetching students:', err);
        setError(apiService.formatError(err));
        setFetchingStudents(false);
      }
    };
    
    fetchStudents();
  }, [teacherId]);

  
  const handleStudentChange = async (event) =>{
    const studentId = event.target.value;
    setSelectedStudent(studentId);

    const student = students.find(s => s.id === studentId);
    if(student){
      try{
        const rrTeacherId = student.RRId;
        const teacherResponse = await apiService.getTeacher(rrTeacherId);
        const teacherLunch = teacherResponse.data.lunch;
        setStudentLunchPeriod(teacherLunch);
      } catch (error){
        console.log("Couldn't find lunch of student");
      }
    }
    else{
      setStudentLunchPeriod(null);
    }
  }
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
      let constructedDate = new Date(selectedDate.toISOString().split('T')[0]);
      constructedDate.setDate(constructedDate.getDate()+1);
      const formData = {studentId: selectedStudent, date: constructedDate, lunches};
      await createSession(formData);

      
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
      setStudentLunchPeriod(null);
    
      
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
        
        <Autocomplete
          id="student-autocomplete"
          options={students}
          getOptionLabel={(option) => option.name || ''}
          value={students.find(student => student.id === selectedStudent) || null}
          onChange={(event, newValue) => {
            const studentId = newValue ? newValue.id : '';
            handleStudentChange({target: {value: studentId}});
          }}
          filterOptions={(options, { inputValue }) => {
            // Only filter by student name
            const searchText = inputValue.toLowerCase();
            return options.filter(option => 
              option.name.toLowerCase().includes(searchText)
            );
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Select Student"
              margin="normal"
              fullWidth
              placeholder="Type student name..."
              disabled={fetchingStudents || loading}
              helperText={fetchingStudents ? "Loading students..." : "Type to search by student name"}
            />
          )}
          renderOption={(props, option) => {
            const { key, ...cleanProps} = props;
            return (
              <Box component="li" key={key} {...cleanProps} sx={{ display: 'flex', alignItems: 'center', py: 1 }}>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="body1">
                  {option.name}
                </Typography>
              </Box>
              {option.lunchPeriod && (
                <Chip
                  label={`Lunch ${option.lunchPeriod}`}
                  size="small"
                  color={
                    option.lunchPeriod === 'A' ? 'error' :
                    option.lunchPeriod === 'B' ? 'success' :
                    option.lunchPeriod === 'C' ? 'primary' :
                    option.lunchPeriod === 'D' ? 'warning' : 'default'
                  }
                  sx={{ ml: 1 }}
                />
            )}
            </Box>
            );
          }}
          noOptionsText={
            fetchingStudents ? "Loading students..." : "No students found"
          }
          loading={fetchingStudents}
          disabled={loading}
          clearOnBlur
          selectOnFocus
          handleHomeEndKeys
          autoHighlight
          openOnFocus
        />
          <PriorityDatePicker 
            studentId={selectedStudent}
            value={selectedDate}
            onChange={setSelectedDate}
            label="Select Tutoring Date"
          
          />
        
        <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
          Select Lunch Periods:
        </Typography>
        
        <FormGroup>
          {['A','B','C','D'].map(period => (
            <FormControlLabel
            key={period}
            control={
              <Checkbox
              checked={lunches[period]}
              onChange={handleLunchChange}
              name={period}
              disabled={period===studentLunchPeriod}
              />
            }
            label={
              period===studentLunchPeriod
              ? `Lunch ${period} (Unavailable)`
              : `Lunch ${period}`
            }
            />
          ))}
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
