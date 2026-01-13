import React, { useEffect } from 'react';
import { Box, Card, CardContent, Typography, Grid } from '@mui/material';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import { useAnalytics } from '../contexts/AnalyticsContext';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const TeacherDashboard = () => {
    const teacherId = localStorage.getItem('teacherId');
    console.log('TEacher Id Type', typeof teacherId);

    const { analytics, loading, error, fetchAnalytics } = useAnalytics();

    useEffect(() => {
        if (teacherId) {
            fetchAnalytics(teacherId);
        }
    }, [teacherId, fetchAnalytics]);

    if (loading) return <Box sx={{ textAlign: 'center', p: 4 }}>Loading analytics...</Box>;
    if (error) return <Box sx={{ textAlign: 'center', p: 4, color: 'error.main' }}>Error: {error}</Box>;
    if (!analytics) return null;

    const { personalStats, schoolStats } = analytics;
    console.log('Personal Stats', personalStats);
    console.log('Total Sessions', personalStats.totalSessions);

    // Chart data definitions stay the same...
    const pieChartData = {
        labels: Object.keys(schoolStats.subjectBreakdown),
        datasets: [{
            label: 'Sessions by Department',
            data: Object.values(schoolStats.subjectBreakdown),
            backgroundColor: [
                'rgba(36, 157, 215, 0.8)',
                'rgba(236, 57, 132, 0.8)',
                'rgba(143, 199, 69, 0.8)',
                'rgba(121, 193, 241, 0.8)',
            ],
            borderColor: ['#249DD7', '#EC3984', '#8FC745', '#79C1F1'],
            borderWidth: 2
        }]
    };

    const topStudentsChartData = {
        labels: personalStats.topStudents.map(s => s.studentName),
        datasets: [{
            label: 'Sessions',
            data: personalStats.topStudents.map(s => s.sessions),
            backgroundColor: 'rgba(143, 199, 69, 0.8)',
            borderColor: '#8FC745',
            borderWidth: 2
        }]
    };

    const dayOfWeekChartData = {
        labels: personalStats.dayOfWeekData.map(d => d.day),
        datasets: [{
            label: 'Sessions',
            data: personalStats.dayOfWeekData.map(d => d.sessions),
            backgroundColor: 'rgba(36, 157, 215, 0.8)',
            borderColor: '#249DD7',
            borderWidth: 2
        }]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
            }
        }
    };

    return (
        <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
            <Typography variant="h4" sx={{ mb: 4, fontWeight: 600 }}>
                Analytics Dashboard
            </Typography>
            
            {/* Stats Cards */}
            <Grid container spacing={3} sx={{ mb: 5 }}>
                <Grid item xs={12} md={4}>
                    <Card sx={{ borderTop: 4, borderColor: '#249DD7' }}>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600 }}>
                                Total Tutoring Sessions
                            </Typography>
                            <Typography variant="h2" sx={{ color: '#249DD7', fontWeight: 'bold', my: 2 }}>
                                {personalStats.totalSessions}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                
                <Grid item xs={12} md={4}>
                    <Card sx={{ borderTop: 4, borderColor: '#8FC745' }}>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600 }}>
                                Last 4 Weeks
                            </Typography>
                            <Typography variant="h2" sx={{ color: '#8FC745', fontWeight: 'bold', my: 2 }}>
                                {personalStats.lastFourWeeksTotal}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                
                <Grid item xs={12} md={4}>
                    <Card sx={{ borderTop: 4, borderColor: '#EC3984' }}>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600 }}>
                                Percentile
                            </Typography>
                            <Typography variant="h2" sx={{ color: '#EC3984', fontWeight: 'bold', my: 2 }}>
                                {personalStats.percentile}th
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                compared to other teachers
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Charts Section */}
            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" sx={{ mb: 2, pb: 1, borderBottom: 2, borderColor: '#D0E9FA' }}>
                                Sessions by Department
                            </Typography>
                            <Box sx={{ height: 350, position: 'relative' }}>
                                <Pie data={pieChartData} options={chartOptions} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" sx={{ mb: 2, pb: 1, borderBottom: 2, borderColor: '#D0E9FA' }}>
                                Your Sessions by Day of Week
                            </Typography>
                            <Box sx={{ height: 350, position: 'relative' }}>
                                <Bar data={dayOfWeekChartData} options={chartOptions} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" sx={{ mb: 2, pb: 1, borderBottom: 2, borderColor: '#D0E9FA' }}>
                                Your Top 10 Most Tutored Students
                            </Typography>
                            <Box sx={{ height: 400, position: 'relative' }}>
                                <Bar data={topStudentsChartData} options={{
                                    ...chartOptions,
                                    indexAxis: 'y',
                                }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default TeacherDashboard;

