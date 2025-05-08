import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import SchoolIcon from '@mui/icons-material/School';

const Header = () => {
  const navigate = useNavigate();
  const teacherId = localStorage.getItem('teacherId');
  const teacherName = localStorage.getItem('teacherName');

  const handleLogout = () => {
    localStorage.removeItem('teacherId');
    localStorage.removeItem('teacherName');
    navigate('/select-teacher');
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <SchoolIcon sx={{ mr: 2 }} />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Tutoring Scheduler
        </Typography>
        
        {teacherId && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="subtitle1" sx={{ mr: 2 }}>
              {teacherName || 'Logged in Teacher'}
            </Typography>
            <Button color="inherit" onClick={handleLogout}>
              Change Teacher
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header;
