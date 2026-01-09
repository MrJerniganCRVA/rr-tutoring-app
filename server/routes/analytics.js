const express = require('express');
const router = express.Router();
const Teacher = require('../models/Teacher');

const Student = require('../models/Student');
const TutoringRequest = require('../models/TutoringRequest');
const {Op} = require('sequelize');
const sequelize = require('../config/db');
const auth = require('../middleware/auth');

router.get('/:teacherId/student/:studentId', async (req, res) => {
    const teacherId = req.params.teacherId;
    const studentId = req.params.studentId;
    try{
        const teacherRequestsForStudent = await TutoringRequest.findAll({
            where:{
                TeacherId: teacherId,
                StudentId: studentId
            }, 
            raw:true
        });
        let count = 0;
        let dates = [];
        teacherRequestsForStudent.forEach(row=>{
            dates.push(row['date']);
            count++;
        });

        res.json({
            studentId: studentId,
            count: count,
            dates: dates
        });
    } catch (error){
        console.error('Analytics Error:',error);
        res.status(500).json({error: error.message});
    }
});

//Personal Stats work
//Need to work on getting Group Stats

//GET /api/analytics/:teacherID
router.get('/:teacherId', async (req, res)=>{
    const {teacherId} = req.params;
    try{
        //All requests
        const allRequests = await TutoringRequest.findAll({
            where: {
                status: 'active'
            },
            include:[{
                model:Teacher
            },{
                model:Student
            }],
            raw:true
        });
        //Personal Info - Total Tutoring Count
        let totalSessions = 0;
        allRequests.forEach(row => {
            const teachId = row['TeacherId'];
            if (teachId==teacherId) {
                totalSessions++;
            }
        });
        
        
        //Last 4 Weeks - Personal
        const fourWeeksAgo = new Date();
        fourWeeksAgo.setDate(fourWeeksAgo.getDate()-28);

        const weeklyData = await TutoringRequest.findAll({
            where:{
                TeacherId: teacherId,
                status: 'active',
                date: {
                    [Op.gte]: fourWeeksAgo
                },
            },
            attributes: ['date'],
            raw:true
        });
        const weekCounts ={};
        weeklyData.forEach(row=>{
            const date = new Date(row.date);
            const dayOfWeek = date.getDay();
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate()-dayOfWeek);
            const weekKey = weekStart.toISOString().split('T')[0];
            if(!weekCounts[weekKey]){
                weekCounts[weekKey] = 0;
            }
            weekCounts[weekKey]++;
        });
        const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const lastFourWeeks = Object.keys(weekCounts)
            .sort()
            .map(weekKey => {
                const date = new Date(weekKey);
                const formattedDate = `${monthNames[date.getMonth()]} ${date.getDate()}`;
                return {
                    week: `Week of ${formattedDate}`,
                    seesions: weekCounts[weekKey]
                };
            });

        const personalStats = {
            totalSessions,
            lastFourWeeks
        };
        //School stats - 
        const subjectBreakdown = {
            'CS':0,
            'Math':0,
            'Science':0,
            'Humanities':0
        };
        allRequests.forEach(row => {
            const subject = row['Teacher.subject'];
            subjectBreakdown[subject]++;
        });
        const schoolStats ={
            subjectBreakdown
        }
        res.json({
            personalStats,
            schoolStats
        });
    } catch (error){
        console.error('Analytics Error:', error);
        res.status(500).json({error: error.message});
    }
});

module.exports = router;