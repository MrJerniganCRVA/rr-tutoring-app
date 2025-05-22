import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { Container, CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import TeacherSelect from './components/TeacherSelect';
import Dashboard from './components/Dashboard';
import Header from './components/Header';
import Scheduling from './components/Scheduling';
import BulkTutoring from './components/BulkTutoring';

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
  console.log("Made it to app");
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Header />
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Routes>
            <Route path="/select-teacher" element={<TeacherSelect />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path='/tutoring' element={<Scheduling />} />
            <Route path="/" element={<Navigate to="/select-teacher" replace />} />
          </Routes>
        </Container>
      </Router>
    </ThemeProvider>
  );
}

export default App;
