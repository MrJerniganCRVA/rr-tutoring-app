const express = require('express');
const router = express.Router();
const Teacher = require('../models/Teacher');

const Student = require('../models/Student');
const TutoringRequest = require('../models/TutoringRequest');
const {Op} = require('sequelize');
const sequelize = require('../config/db');
const auth = require('../middleware/auth');

//Personal Stats work
//Need to work on getting Group Stats

//GET /api/analytics/:teacherID
router.get('/:teacherId', async (req, res)=>{
    const {teacherId} = req.params;
    try{
        const totalSessions = await TutoringRequest.count({
            where:{
                id:teacherId,
                status: 'active'
            }
        });
        const uniqueStudents = await TutoringRequest.count({
            where: {
                teacherId: teacherId,
                status:'active'
            }, 
            distinct: true,
            col: 'studentId'
        });
        
        //Last 4 Weeks - Personal
        const fourWeeksAgo = new Date();
        fourWeeksAgo.setDate(fourWeeksAgo.getDate()-28);

        const weeklyData = await TutoringRequest.findAll({
            where:{
                teacherId: teacherId,
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
            weekCount[weekKey]++;
        });
        const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const lastFourWeeks = Object.keys(weekCounts)
            .sort()
            .map(weekKey => {
                const date = new Date(weekKey);
                const formmatedDate = `${monthNames[date.getMonth()]} ${date.getDate()}`;
                return {
                    week: `Week of ${formattedDate}`,
                    seesions: weekCounts[weekKeys]
                };
            });

        const personalStats = {
            totalSessions,
            uniqueStudents
        };
        //School Stats
        const allRequests = await TutoringRequest.findAll({
            where: {
                status: 'active'
            },
            include: [{
                model:Teacher,
                attribute:['subject']
            }],
            attributes: ['Teacher.subject'],
            raw:true
        });
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
        

        res.json({
            personalStats,
            subjectBreakdown,
            lastFourWeeks
        });
    } catch (error){
        console.error('Analytics Error:', error);
        res.status(500).json({error: error.message});
    }
});

module.exports = router;