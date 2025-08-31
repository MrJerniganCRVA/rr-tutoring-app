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
import apiService from '../utils/apiService';

const TeacherSelect = () => {
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const getFullName = (teacher) => {
    if (!teacher?.first_name || !teacher?.last_name) return 'Unknown Teacher';
    return `${teacher.first_name} ${teacher.last_name}`;
  };
  useEffect(() => {
    // Check if a teacher is already selected
    const savedTeacherId = localStorage.getItem('teacherId');
    if (savedTeacherId) {
      navigate('/dashboard');
      return;
    }
    // Fetch teachers from API
    const fetchTeachers = async () =>{
      try{
        const response = await apiService.getTeachers();
        setTeachers(response.data);
        setLoading(false);
      } catch (e){
        console.error("Error in fetching teachers",e);
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
      localStorage.setItem('teacherName', getFullName(teacher));
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
          Select Your Name Below:
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
                    {getFullName(teacher)} - {teacher.subject}
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
