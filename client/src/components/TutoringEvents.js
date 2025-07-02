import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import TutoringRequestList from './TutoringRequestList';

const TutoringEvents = () => {
    const [loading, setLoading] = useState(true);
    //const [students, setStudents] = useState([]);
    const [requests, setRequests] = useState([]);
    const navigate = useNavigate();


    useEffect(()=>{
        const teacherId = localStorage.getItem('teacherId');
        if(!teacherId){
            navigate('select-teacher');
            return;
        }

        const fetchRequests = async () =>{
            try{
                setLoading(true);
                const response = await axios.get('http://localhost:5000/api/tutoring');
                setRequests(response.data);
                setLoading(false);
            } catch (err){
                console.error('error fetching requests', err);
                setLoading(false);
            }
        };
        
        fetchRequests();

    }, [navigate]);
    if (loading){
        return (
            <Box sx={{display: 'flex', justifyContent:'center', mt:4}}>
                <CircularProgress />
            </Box>
        )
    }
    const handleRequestCancelled = (requestId) => {
        setRequests(
            requests.map(request => 
                request.id===requestId
                ? {...request, status:'cancelled'}
                : request
            )
        );
    };
    
    //need to add Oauth with bulk calendar invite
    //don't forget to check for if event already exists? 
    //automated would be nice but would create many event
    //all in one would be better imo
    

    return (
    <Box>
        <Typography variant="h4" component="h1" gutterBottom>
            Tutoring Request List
        </Typography>
            <TutoringRequestList
                requests={requests}
                onRequestCancelled={handleRequestCancelled}
            />
    </Box>
)};

export default TutoringEvents;