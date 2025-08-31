import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import TutoringRequestList from './TutoringRequestList';
import {useTutoring} from '../contexts/TutoringContext';

const TutoringEvents = () => {

    //need to add Oauth with bulk calendar invite
    //don't forget to check for if event already exists? 
    //automated would be nice but would create many event
    //all in one would be better imo
    

    return (
    <Box>
        <Typography variant="h4" component="h1" gutterBottom>
            Tutoring Request List
        </Typography>
            <TutoringRequestList />
    </Box>
)};

export default TutoringEvents;