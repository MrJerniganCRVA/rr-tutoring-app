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
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Chip,
  Grid
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { isSaturday, isSunday, format } from 'date-fns';
import apiService from '../utils/apiService';

// Icons
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import PersonIcon from '@mui/icons-material/Person';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SchoolIcon from '@mui/icons-material/School';

const BulkTutoring = () => {
  // State for form fields
  const [selectedDate, setSelectedDate] = useState(null);
  const [lunches, setLunches] = useState({
    A: false,
    B: false,
    C: false,
    D: false
  });
  
  // State for students management
  const [allStudents, setAllStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [studentFilter, setStudentFilter] = useState('');
  
  // State for API interactions
  const [loading, setLoading] = useState(false);
  const [fetchingStudents, setFetchingStudents] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [results, setResults] = useState([]);
  
  // Get the logged in teacher
  const teacherId = localStorage.getItem('teacherId');
  const teacherName = localStorage.getItem('teacherName');
  
  // Load all students when component mounts
  useEffect(() => {
    fetchStudents();
  }, []);
  
  // Filter students when search term changes
  const filteredStudents = allStudents.filter(student => 
    student.name.toLowerCase().includes(studentFilter.toLowerCase())
  );
  
  // Fetch all students from API
  const fetchStudents = async () => {
    try {
      setFetchingStudents(true);
      const response = await apiService.getStudents();
      
      // Process students to add display info
      const processedStudents = response.data.map(student => {
        // Get lunch period from RR teacher if available
        let lunchPeriod = null;
        if (student.teachers && student.teachers.RR && student.teachers.RR.lunch) {
          lunchPeriod = student.teachers.RR.lunch;
        } else if (student.RR && student.RR.lunch) {
          lunchPeriod = student.RR.lunch;
        } else if (student.lunchPeriod) {
          lunchPeriod = student.lunchPeriod;
        }
        
        return {
          ...student,
          lunchPeriod,
          displayName: lunchPeriod ? `[${lunchPeriod}] ${student.name}` : student.name
        };
      });
      
      setAllStudents(processedStudents);
      setFetchingStudents(false);
    } catch (err) {
      console.error('Error fetching students:', err);
      setError(apiService.formatError(err));
      setFetchingStudents(false);
    }
  };
  
  // Handler for lunch checkbox changes
  const handleLunchChange = (event) => {
    setLunches({
      ...lunches,
      [event.target.name]: event.target.checked
    });
  };
  
  // Handler for adding a student to the selected list
  const handleAddStudent = () => {
    if (!selectedStudentId) return;
    
    // Find the student from all students
    const studentToAdd = allStudents.find(s => s.id === selectedStudentId);
    
    // Check if student is already selected
    if (selectedStudents.some(s => s.id === selectedStudentId)) {
      setError(`${studentToAdd.name} is already in your selection.`);
      return;
    }
    
    // Add to selected students
    setSelectedStudents([...selectedStudents, studentToAdd]);
    
    // Reset selection
    setSelectedStudentId('');
    setError('');
  };
  
  // Handler for removing a student from the selected list
  const handleRemoveStudent = (studentId) => {
    setSelectedStudents(selectedStudents.filter(s => s.id !== studentId));
  };
  
  // Check if the form is valid for submission
  const isFormValid = () => {
    // Need a date
    if (!selectedDate) return false;
    
    // Need at least one lunch period
    if (!Object.values(lunches).some(v => v)) return false;
    
    // Need at least one student
    if (selectedStudents.length === 0) return false;
    
    return true;
  };
  
  // Handler for form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset messages
    setError('');
    setSuccess('');
    setResults([]);
    
    // Validate form
    if (!isFormValid()) {
      setError('Please select a date, at least one lunch period, and at least one student.');
      return;
    }
    
    setLoading(true);
    
    try {
      // Process each student as a separate request
      const requests = [];
      const successfulStudents = [];
      const failedStudents = [];
      
      for (const student of selectedStudents) {
        try {
          const response = await apiService.createTutoringRequest({
            studentId: student.id,
            date: selectedDate.toISOString().split('T')[0],
            lunches
          });
          
          successfulStudents.push({
            student: student.name,
            id: response.data.id
          });
        } catch (studentError) {
          failedStudents.push({
            student: student.name,
            error: apiService.formatError(studentError)
          });
        }
      }
      
      // Set results
      setResults({
        date: format(selectedDate, 'MMMM d, yyyy'),
        lunches: Object.keys(lunches).filter(key => lunches[key]),
        total: selectedStudents.length,
        successful: successfulStudents.length,
        successfulStudents,
        failedStudents
      });
      
      if (failedStudents.length === 0) {
        setSuccess(`Successfully scheduled ${successfulStudents.length} students for tutoring on ${format(selectedDate, 'MMMM d, yyyy')}.`);
      } else if (successfulStudents.length === 0) {
        setError('Failed to schedule any students for tutoring.');
      } else {
        setSuccess(`Partially successful: Scheduled ${successfulStudents.length} out of ${selectedStudents.length} students.`);
      }
      
      // Reset form if completely successful
      if (failedStudents.length === 0) {
        setSelectedStudents([]);
        setSelectedDate(null);
        setLunches({
          A: false,
          B: false,
          C: false,
          D: false
        });
      }
      
    } catch (err) {
      console.error('Error creating tutoring requests:', err);
      setError(apiService.formatError(err));
    } finally {
      setLoading(false);
    }
  };
  
  // Function to check if a date should be disabled
  const isWeekend = (date) => {
    return isSaturday(date) || isSunday(date);
  };
  
  return (
    <Box>
      
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          Schedule Multiple Students
        </Typography>
        
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        
        {results.successfulStudents && results.successfulStudents.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Results Summary
            </Typography>
            <Typography>
              Date: {results.date}
            </Typography>
            <Typography>
              Lunch Periods: {results.lunches.join(', ')}
            </Typography>
            <Typography>
              Successfully scheduled: {results.successful} out of {results.total} students
            </Typography>
            
            {results.failedStudents && results.failedStudents.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1" color="error">
                  Failed students:
                </Typography>
                <List dense>
                  {results.failedStudents.map((failure, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <RemoveIcon color="error" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={failure.student} 
                        secondary={failure.error} 
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </Box>
        )}
        
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Session Details
              </Typography>
              
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Tutoring Date"
                  value={selectedDate}
                  onChange={(newDate) => setSelectedDate(newDate)}
                  renderInput={(params) => (
                    <TextField {...params} fullWidth margin="normal" />
                  )}
                  shouldDisableDate={isWeekend}
                  minDate={new Date()}
                  disabled={loading}
                />
              </LocalizationProvider>
              
              <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                Select Lunch Periods:
              </Typography>
              
              <FormGroup>
                <Grid container spacing={1}>
                  {['A', 'B', 'C', 'D'].map((period) => (
                    <Grid item xs={6} key={period}>
                      <FormControlLabel 
                        control={
                          <Checkbox 
                            checked={lunches[period]} 
                            onChange={handleLunchChange} 
                            name={period} 
                            disabled={loading}
                          />
                        } 
                        label={`Lunch ${period}`} 
                      />
                    </Grid>
                  ))}
                </Grid>
              </FormGroup>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Student Selection
              </Typography>
              
              {/* <TextField
                fullWidth
                margin="normal"
                label="Filter Students"
                value={studentFilter}
                onChange={(e) => setStudentFilter(e.target.value)}
                disabled={loading}
              />
               */}
              <FormControl fullWidth margin="normal">
                <InputLabel id="student-select-label">Add Student</InputLabel>
                <Select
                  labelId="student-select-label"
                  value={selectedStudentId}
                  label="Add Student"
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  disabled={fetchingStudents || loading}
                >
                  {fetchingStudents ? (
                    <MenuItem disabled>Loading students...</MenuItem>
                  ) : filteredStudents.length === 0 ? (
                    <MenuItem disabled>No students match your filter</MenuItem>
                  ) : (
                    filteredStudents.map((student) => (
                      <MenuItem 
                        key={student.id} 
                        value={student.id}
                        sx={{
                          backgroundColor: student.lunchPeriod === 'A' ? 'rgba(255, 0, 0, 0.05)' :
                                          student.lunchPeriod === 'B' ? 'rgba(0, 255, 0, 0.05)' :
                                          student.lunchPeriod === 'C' ? 'rgba(0, 0, 255, 0.05)' :
                                          student.lunchPeriod === 'D' ? 'rgba(255, 255, 0, 0.05)' : 'inherit'
                        }}
                      >
                        {student.displayName}
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
              
              <Button
                variant="outlined"
                color="primary"
                onClick={handleAddStudent}
                disabled={!selectedStudentId || loading}
                startIcon={<AddIcon />}
                sx={{ mt: 1 }}
              >
                Add Student
              </Button>
            </Grid>
          </Grid>
          
          {selectedStudents.length > 0 && (
            <Box sx={{ mt: 3, mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Selected Students ({selectedStudents.length})
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, maxHeight: 200, overflow: 'auto' }}>
                <List dense>
                  {selectedStudents.map((student) => (
                    <ListItem
                      key={student.id}
                      sx={{pr:15}}
                      secondaryAction={
                        <Button
                          edge="end"
                          color="error"
                          size="small"
                          onClick={() => handleRemoveStudent(student.id)}
                          disabled={loading}
                        >
                          Remove
                        </Button>
                      }
                    >
                      <ListItemIcon>
                        <PersonIcon />
                      </ListItemIcon>
                      <ListItemText 
                        primary={student.name} 
                        secondary={
                          student.lunchPeriod ? `Lunch: ${student.lunchPeriod}` : 'No lunch info'
                        } 
                        sx={{mr:2}}
                      />
                      {student.lunchPeriod && (
                        <Box sx={{flexShrink: 0}}>
                        <Chip 
                          label={`Lunch ${student.lunchPeriod}`} 
                          size="small" 
                          color={
                            student.lunchPeriod === 'A' ? 'error' :
                            student.lunchPeriod === 'B' ? 'success' :
                            student.lunchPeriod === 'C' ? 'primary' :
                            student.lunchPeriod === 'D' ? 'warning' : 'default'
                          }
                          />
                          </Box>  
                      )}
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Box>
          )}
          
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 3 }}
            disabled={!isFormValid() || loading}
          >
            {loading ? (
              <CircularProgress size={24} />
            ) : (
              `Schedule ${selectedStudents.length} Students for Tutoring`
            )}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default BulkTutoring;
