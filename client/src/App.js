import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { Container, CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import TeacherSelect from './components/TeacherSelect';
import RaptorRotation from './components/RaptorRotation';
import Header from './components/Header';
import Scheduling from './components/Scheduling';
import TutoringEvents from './components/TutoringEvents';
import {TutoringProvider } from './contexts/TutoringContext';
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
        <Header />

        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <TutoringProvider>
          <Routes>
            <Route path="/select-teacher" element={<TeacherSelect />} />
            <Route path="/dashboard" element={<RaptorRotation />} />
            <Route path="/tutoring" element={<Scheduling />} />
            <Route path="/calendar" element={<TutoringEvents />} />
            <Route path="/" element={<Navigate to="/select-teacher" replace />} />
          </Routes>
          </TutoringProvider>
        </Container>
      </Router>
      <Footer />
    </ThemeProvider>
  );
}

export default App;
