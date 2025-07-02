// client/src/components/Header.js with BulkTutoring navigation
import React from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box, 
  Tabs, 
  Tab
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import SchoolIcon from '@mui/icons-material/School';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const teacherId = localStorage.getItem('teacherId');
  const teacherName = localStorage.getItem('teacherName');
  
  const handleLogout = () => {
    localStorage.removeItem('teacherId');
    localStorage.removeItem('teacherName');
    navigate('/select-teacher');
  };

  const getTabValue = () => {
    if (location.pathname === '/dashboard') return 0;
    if (location.pathname === '/tutoring') return 1;
    if (location.pathname === '/calendar') return 2;
    return false;
  };
  
  // Show navigation only if logged in
  if (!teacherId) {
    return (
      <AppBar position="static">
        <Toolbar>
          <SchoolIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Tutoring Scheduler
          </Typography>
        </Toolbar>
      </AppBar>
    );
  }
  
  return (
    <AppBar position="static">
      <Toolbar>
        <SchoolIcon sx={{ mr: 2 }} />
        <Typography variant="h6" component="div" sx={{ mr: 2 }}>
          Tutoring Scheduler
        </Typography>
        
        <Tabs 
          value={getTabValue()} 
          textColor="inherit"
          indicatorColor="secondary"
          sx={{ flexGrow: 1 }}
        >
          <Tab label="Raptor Rotation" onClick={() => navigate('/dashboard')} />
          <Tab label="Requests" onClick={() => navigate('/tutoring')} />
          <Tab label="Events" onClick={() => navigate('/calendar')} />
        </Tabs>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="subtitle1" sx={{ mr: 2 }}>
            {teacherName || 'Login'}
          </Typography>
          <Button color="inherit" onClick={handleLogout}>
            Change Teacher
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
