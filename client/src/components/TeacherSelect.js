import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Button, 
  Alert, 
  CircularProgress 
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const TeacherSelect = () => {
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Check if a teacher is already selected
    const savedTeacherId = localStorage.getItem('teacherId');
    if (savedTeacherId) {
      navigate('/dashboard');
      return;
    }

    // Fetch teachers from API
    const fetchTeachers = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:5000/api/teachers');
        setTeachers(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching teachers:', err);
        setError('Failed to load teachers. Please try again later.');
        setLoading(false);
      }
    };

    fetchTeachers();
  }, [navigate]);

  const handleChange = (event) => {
    const teacherId = event.target.value;
    setSelectedTeacher(teacherId);
    
    // Find the teacher name
    const teacher = teachers.find(t => t.id === teacherId);
    if (teacher) {
      localStorage.setItem('teacherName', teacher.name);
    }
  };

  const handleSubmit = () => {
    if (selectedTeacher) {
      localStorage.setItem('teacherId', selectedTeacher);
      navigate('/dashboard');
    } else {
      setError('Please select a teacher');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 8, display: 'flex', justifyContent: 'center' }}>
      <Paper elevation={3} sx={{ p: 4, width: '100%', maxWidth: 500 }}>
        <Typography variant="h5" component="h1" align="center" gutterBottom>
          Select Your Teacher Profile
        </Typography>
        
        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
        
        {teachers.length === 0 ? (
          <Alert severity="info">
            No teachers found. Please add teachers to the system.
          </Alert>
        ) : (
          <>
            <FormControl fullWidth margin="normal">
              <InputLabel id="teacher-select-label">Teacher</InputLabel>
              <Select
                labelId="teacher-select-label"
                value={selectedTeacher}
                label="Teacher"
                onChange={handleChange}
              >
                {teachers.map((teacher) => (
                  <MenuItem key={teacher.id} value={teacher.id}>
                    {teacher.name} - {teacher.subject}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <Button
              variant="contained"
              color="primary"
              fullWidth
              sx={{ mt: 3 }}
              onClick={handleSubmit}
              disabled={!selectedTeacher}
            >
              Continue to Dashboard
            </Button>
          </>
        )}
      </Paper>
    </Box>
  );
};

export default TeacherSelect;
