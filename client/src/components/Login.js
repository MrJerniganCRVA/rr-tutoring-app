import React, {useState, useEffect} from 'react';
import{
    Box,
    Typography,
    Paper,
    Button,
    Alert, 
    CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import GoogleIcon from '@mui/icons-material/Google';

const API_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

const Login = () =>{
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(()=>{
        //check if user is already auth
        const checkAuth = async () =>{
            try{
                const response = await fetch(`${API_URL}/auth/current`,{
                    credentials: 'include'
                });
                if(response.ok){
                    const teacher = await response.json();
                    //user logged in redirect to dashboard
                    localStorage.setItem('teacherId',teacher.id);
                    localStorage.setItem('teacherName', `${teacher.firstName} ${teacher.lastName}`);
                    localStorage.setItem('isAdmin', teacher.isAdmin ? 'true' : 'false');
                    navigate('/dashboard');
                } else{
                    //not logged in, show login
                    setLoading(false);
                }
            } catch(err){
                console.error('Auth check failed in Login component', err);
                setLoading(false);
            }
        };

        //check for errors in url params
        const urlParams = new URLSearchParams(window.location.search);
        const authError = urlParams.get('error');
        if(authError==='auth_failed'){
            setError('Authentication failed. Please make sure you are logging in with school email');
        }
        checkAuth();
    }, [navigate]);

    const handleGoogleLogin = () => {
        //redirect to backend
        window.location.href=`${API_URL}/auth/google`;
    };
    if(loading){
        return(
            <Box sx={{display:'flex', justifyContent:'center', minHeight:'100vh'}}>
                <CircularProgress />
            </Box>
        );
    }
    return (
        <Box sx={{
            minHeight:'60vh',
            display:'flex',
            justifyContent:'center',
            alignItems:'center',
            backgroundColor: '#f5f5f5'


        }}>
            <Paper elevation={3} sx={{ p:3, width:'85%', maxWidth:380, textAlign:'center'}}>
                <Typography variant="h4" component="h1" gutterBottom>
                    RR Tutoring Scheduler
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{mb:3}}>
                    Sign in with your CodeRVA Google Account to access the Tutoring Page.
                </Typography>
                {error && <Alert severity="error" sx={{mb:2}}>{error}</Alert>}
                <Button 
                    variant="contained"
                    color="primary"
                    fullWidth
                    size="large"
                    startIcon={<GoogleIcon />}
                    onClick={handleGoogleLogin}
                    sx={{
                        py:1.2,
                        textTransform: 'none',
                        fontSize:'16px',
                        '&:hover':{
                            backgroundColor:'#79c1f1',
                            color:'#222222'
                        }
                    }}
                >
                    Sign In With Google
                </Button>
                <Typography variant="caption" color="text.secondary" sx={{mt:3, display:'block'}}>
                    Only CodeRVA Teachers can login
                </Typography>
            </Paper>
        </Box>
    )
};
export default Login;