import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { Box, Container, CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import TeacherSelect from './components/TeacherSelect';
import RaptorRotation from './components/RaptorRotation';
import TeacherDashboard from './components/TeacherDashboard';
import Header from './components/Header';
import Scheduling from './components/Scheduling';
import TutoringEvents from './components/TutoringEvents';
import {TutoringProvider } from './contexts/TutoringContext';
import { AnalyticsProvider } from './contexts/AnalyticsContext';
import Footer from './components/Footer';

// Create a theme instance
const theme = createTheme({
  palette: {
    primary: {
      main: '#ec3a8f',
    },
    secondary: {
      main: '#8fc644',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 500,
    },
  },
});

function App() {
  return (

    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh'
        }}>
        <Header />

        <Container maxWidth="lg" sx={{ mt: 4, mb: 4, minHeight:'65vh', flex: 1}}>
        <TutoringProvider>
          <AnalyticsProvider>
            <Routes>
              <Route path="/select-teacher" element={<TeacherSelect />} />
              <Route path="/dashboard" element={<RaptorRotation />} />
              <Route path="/tutoring" element={<Scheduling />} />
              <Route path="/calendar" element={<TutoringEvents />} />
              <Route path="/analytics" element={<TeacherDashboard />} />
              <Route path="/" element={<Navigate to="/select-teacher" replace />} />
            </Routes>
          </AnalyticsProvider>
          </TutoringProvider>
        </Container>
       <Footer />
       </Box>
      </Router>
      
    </ThemeProvider>
  );
}

export default App;
