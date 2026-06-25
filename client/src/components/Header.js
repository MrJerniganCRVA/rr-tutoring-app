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
import { useAuth } from '../contexts/AuthContext';

const API_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, clearUser } = useAuth();

  const teacherName = currentUser
    ? `${currentUser.firstName} ${currentUser.lastName}`
    : localStorage.getItem('teacherName');
  const isAdmin = currentUser?.isAdmin ?? false;
  const isLoggedIn = !!(currentUser || localStorage.getItem('teacherId'));

  const handleLogout = async () => {
    try{
      await fetch(`${API_URL}/auth/logout`, {
        credentials: 'include',
        method: 'GET'
      });
    } catch (err){
      console.error("Logout failed", err);
    } finally {
      clearUser();
      navigate('/select-teacher');
    }
  };

  const getTabValue = () => {
    if (location.pathname === '/dashboard') return 0;
    if (location.pathname === '/tutoring') return 1;
    if (location.pathname === '/calendar') return 2;
    if (location.pathname === '/analytics') return 3;
    if (location.pathname === '/roster') return 4;
    return false;
  };
  
  // Show navigation only if logged in
  if (!isLoggedIn) {
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
          <Tab label="Analytics" onClick={() => navigate('/analytics')} />
          {isAdmin && <Tab label="Roster" onClick={() => navigate('/roster')} />}
        </Tabs>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="subtitle1" sx={{ mr: 2 }}>
            {teacherName || 'Login'}
          </Typography>
          {teacherName &&(
            <Button color="inherit" onClick={handleLogout}>
            Log Out
          </Button>)}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
