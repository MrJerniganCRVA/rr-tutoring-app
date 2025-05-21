// client/src/components/Header.js with BulkTutoring navigation
import React from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box, 
  Tabs, 
  Tab,
  useMediaQuery,
  useTheme,
  IconButton,
  Menu,
  MenuItem
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import SchoolIcon from '@mui/icons-material/School';
import MenuIcon from '@mui/icons-material/Menu';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  
  const teacherId = localStorage.getItem('teacherId');
  const teacherName = localStorage.getItem('teacherName');
  
  const handleLogout = () => {
    localStorage.removeItem('teacherId');
    localStorage.removeItem('teacherName');
    navigate('/select-teacher');
  };
  
  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleNavigation = (path) => {
    navigate(path);
    handleMenuClose();
  };
  
  const getTabValue = () => {
    if (location.pathname === '/dashboard') return 0;
    if (location.pathname === '/bulk-tutoring') return 1;
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
  
  // Mobile view
  if (isMobile) {
    return (
      <AppBar position="static">
        <Toolbar>
          <SchoolIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Tutoring Scheduler
          </Typography>
          
          <IconButton
            color="inherit"
            onClick={handleMenuClick}
            edge="end"
          >
            <MenuIcon />
          </IconButton>
          
          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleMenuClose}
            MenuListProps={{
              'aria-labelledby': 'menu-button',
            }}
          >
            <MenuItem onClick={() => handleNavigation('/dashboard')}>
              Dashboard
            </MenuItem>
            <MenuItem onClick={() => handleNavigation('/bulk-tutoring')}>
              Bulk Tutoring
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              Change Teacher
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
    );
  }
  
  // Desktop view
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
          <Tab label="Dashboard" onClick={() => navigate('/dashboard')} />
          <Tab label="Bulk Tutoring" onClick={() => navigate('/bulk-tutoring')} />
        </Tabs>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="subtitle1" sx={{ mr: 2 }}>
            {teacherName || 'Logged in Teacher'}
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
