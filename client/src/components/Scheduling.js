import React from 'react';
import { Box, Typography } from '@mui/material';
import TutoringRequestForm from './TutoringRequestForm';

const Scheduling = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Schedule Tutoring Sessions
      </Typography>
      <TutoringRequestForm />
    </Box>
  );
};

export default Scheduling;
