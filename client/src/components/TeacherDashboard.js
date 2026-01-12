//TeacherDashboard from backend API data
import React, { useEffect } from 'react';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import { useAnalytics } from '../contexts/AnalyticsContext';
import '../assets/css/TeacherDashboard.css';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const TeacherDashboard = () => {
    const teacherId = localStorage.getItem('teacherId');
    console.log("Pulling teacherId from storage", teacherId);
    const { analytics, loading, error, fetchAnalytics } = useAnalytics();

    useEffect(() => {
        if (teacherId) {
            console.log("Fetching analysis for", teacherId);
            fetchAnalytics(teacherId);
        }
    }, [teacherId]);
    console.log('analytics', analytics);

    if (loading) return <div className="dashboard-loading">Loading analytics...</div>;
    if (error) return <div className="dashboard-error">Error: {error}</div>;
    if (!analytics) return null;
    if(!analytics.personalStats) return <div className="dashboard-error">No personal stats found</div>;
    if(!analytics.schoolStats) return <div className="dashboard-error">No school stats found</div>;
    const { personalStats, schoolStats } = analytics;

    // Pie Chart Data - Subject Breakdown
    const pieChartData = {
        labels: Object.keys(schoolStats.subjectBreakdown),
        datasets: [{
            label: 'Sessions by Department',
            data: Object.values(schoolStats.subjectBreakdown),
            backgroundColor: [
                'rgba(54, 162, 235, 0.8)',
                'rgba(255, 99, 132, 0.8)',
                'rgba(75, 192, 192, 0.8)',
                'rgba(255, 206, 86, 0.8)',
            ],
            borderColor: [
                'rgba(54, 162, 235, 1)',
                'rgba(255, 99, 132, 1)',
                'rgba(75, 192, 192, 1)',
                'rgba(255, 206, 86, 1)',
            ],
            borderWidth: 2
        }]
    };

    // Bar Chart Data - Top 10 Students
    const topStudentsChartData = {
        labels: personalStats.topStudents.map(s => s.studentName),
        datasets: [{
            label: 'Sessions',
            data: personalStats.topStudents.map(s => s.sessions),
            backgroundColor: 'rgba(75, 192, 192, 0.8)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 2
        }]
    };

    // Bar Chart Data - Day of Week
    const dayOfWeekChartData = {
        labels: personalStats.dayOfWeekData.map(d => d.day),
        datasets: [{
            label: 'Sessions',
            data: personalStats.dayOfWeekData.map(d => d.sessions),
            backgroundColor: 'rgba(153, 102, 255, 0.8)',
            borderColor: 'rgba(153, 102, 255, 1)',
            borderWidth: 2
        }]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
            legend: {
                position: 'top',
            }
        }
    };

    return (
        <div className="teacher-dashboard">
            <h1>Analytics Dashboard</h1>
            
            {/* Stats Cards */}
            <div className="stats-cards">
                <div className="stat-card">
                    <h3>Total Tutoring Sessions</h3>
                    <div className="stat-number">{personalStats.totalSessions}</div>
                </div>
                
                <div className="stat-card">
                    <h3>Last 4 Weeks</h3>
                    <div className="stat-number">{personalStats.last4WeeksTotal}</div>
                </div>
                
                <div className="stat-card">
                    <h3>Percentile</h3>
                    <div className="stat-number">{personalStats.percentile}th</div>
                    <div className="stat-subtitle">compared to other teachers</div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="charts-container">
                <div className="chart-card">
                    <h3>Sessions by Department</h3>
                    <div className="chart-wrapper">
                        <Pie data={pieChartData} options={chartOptions} />
                    </div>
                </div>

                <div className="chart-card chart-card-wide">
                    <h3>Top 10 Most Tutored Students</h3>
                    <div className="chart-wrapper">
                        <Bar data={topStudentsChartData} options={{
                            ...chartOptions,
                            indexAxis: 'y',
                        }} />
                    </div>
                </div>

                <div className="chart-card">
                    <h3>Sessions by Day of Week</h3>
                    <div className="chart-wrapper">
                        <Bar data={dayOfWeekChartData} options={chartOptions} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TeacherDashboard;
