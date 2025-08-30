//Need to implement mui component and add in context to the app

import React, { useState, useEffect } from 'react';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Box, Chip, Alert, Typography } from '@mui/material';
import { useTutoring } from '../contexts/TutoringContext';
import apiService from '../utils/apiService';

// Priority mapping
const SUBJECT_PRIORITIES = {
  1: 'CS',        // Monday
  2: 'Math',      // Tuesday  
  4: 'Humanities', // Thursday
  5: 'Science'    // Friday
};

const PriorityDatePicker = ({ 
  studentId,
  value, 
  onChange,
  ...muiDatePickerProps 
}) => {
  const {  getSessionsForStudent } = useTutoring();
  const [currentTeacher, setCurrentTeacher] = useState(null);
  const [dateStatus, setDateStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  // Get teacher from localStorage
  useEffect(() => {
    const fetchCurrentTeacher = async () =>{
      const teacherId = localStorage.getItem('teacherId');
      if(!teacherId){
        console.error("No teacher id in local storage");
        setLoading(false);
        return;
      }
      try{
        const response = await apiService.getTeacher(teacherId);
        setCurrentTeacher(response.data);
      } catch(e){
        console.error("Error fetching teacher", apiService.formatError(e));
      } finally{
        setLoading(false);
      }

    }

    fetchCurrentTeacher();
    
  }, []);
  const getDay = (date) => date.toISOString().split('T')[0];
  // Get sessions for the selected student
  const studentSessions = studentId ? getSessionsForStudent(studentId) : [];

  //all sessions work but the getSessionForStudent(studentId) isn't filtering
  //fix or add filter to own section

  // Utility functions
  const isSameDay = (date1, date2) => {
    return date1.toISOString().split('T')[0] === date2.toISOString().split('T')[0];
  };

  const shouldDisableDate = (date) => {
    const yesteday = new Date();
    yesteday.setDate(yesteday.getDate()-1);
    if(date < yesteday) return true;
    const dayOfWeek = date.getDay();
    
    // Disable weekends and Wednesday
    if (dayOfWeek === 0 || dayOfWeek === 6 || dayOfWeek === 3) {
      return true;
    }
    
    if (!studentId || !currentTeacher) return false;

    // Check if student has a session on this date
    const existingSession = studentSessions.find(session => 
      isSameDay(new Date(session.date), date)
    );
    
    if (!existingSession) {
      return false;
    }

    // If current teacher's subject has priority for this day, allow selection
    const dayPrioritySubject = SUBJECT_PRIORITIES[dayOfWeek];
    if (currentTeacher.subject === dayPrioritySubject) {
      return false; // Can override
    }
    return true; // Otherwise, disable the date
  };

  const getDateStatusInfo = (date) => {
    if (!studentId || !date || !currentTeacher) return null;

    const dayOfWeek = getDay(date);
    const existingSession = studentSessions.find(session => 
      isSameDay(new Date(session.date), date)
    );
    //Need to check on return type for priority days. Make sure matching to component expected
    if (!existingSession) { 
      return { type: 'available', message: 'Available' };
    }

    const dayPrioritySubject = SUBJECT_PRIORITIES[dayOfWeek];
    
    if (currentTeacher.subject === dayPrioritySubject) {
      return { 
        type: 'canOverride', 
        message: `Will override existing booking (${currentTeacher.subject} priority day)`,
        existingSession
      };
    }

    return { 
      type: 'blocked', 
      message: `Already booked`,
      existingSession
    };
  };

  const handleDateChange = (newDate) => {
    if (newDate) {
      setDateStatus(getDateStatusInfo(newDate));
    } else {
      setDateStatus(null);
    }
    onChange(newDate);
  };
  //Don't render if loading
  if(loading){
    return (
      <Box sx={{ p: 2, border: '1px dashed #ccc', borderRadius: 1 }}>
        <Typography color="text.secondary">
          Loading teacher information...
        </Typography>
      </Box>
    );
  }
  // Don't render if no student selected
  if (!studentId) {
    return (
      <Box sx={{ p: 2, border: '1px dashed #ccc', borderRadius: 1 }}>
        <Typography color="text.secondary">
          Please select a student first
        </Typography>
      </Box>
    );
  };

  const getStatusColor = (type) => {
    switch (type) {
      case 'available': return 'success';
      case 'canOverride': return 'warning';
      case 'blocked': return 'error';
      default: return 'default';
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <DatePicker
          value={value}
          onChange={handleDateChange}
          shouldDisableDate={shouldDisableDate}
          {...muiDatePickerProps} // All your existing MUI props
        />
        
        {dateStatus && (
          <Box sx={{ mt: 2 }}>
            <Chip
              label={dateStatus.message}
              color={getStatusColor(dateStatus.type)}
              variant="outlined"
              size="small"
            />
            
            {dateStatus.type === 'canOverride' && (
              <Alert severity="warning" sx={{ mt: 1 }}>
                <Typography variant="body2">
                  This will override the existing booking because {currentTeacher?.subject} has 
                  priority on {value?.toLocaleDateString('en-US', { weekday: 'long' })}s.
                </Typography>
              </Alert>
            )}
          </Box>
        )}
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Priority: Mon(CS) | Tue(Math) | Thu(Humanities) | Fri(Science) 
        </Typography>
      </Box>
    </LocalizationProvider>
  );
};

export default PriorityDatePicker;