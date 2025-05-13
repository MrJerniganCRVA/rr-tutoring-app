const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const TutoringRequest = require('../models/TutoringRequest');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const auth = require('../middleware/auth');
// @route   GET api/teachers/:id
// @desc    Get teacher by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const tutoringevent = await TutoringRequest.findByPk(req.params.id);
    
    if (!tutoringevent) {
      return res.status(404).json({ msg: 'Tutoring Event not found' });
    }
    
    res.json(tutoringevent);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});
// @route   GET api/tutoring
// @desc    Get all tutoring requests
// @access  Public
router.get('/', async (req, res) => {
  try {
    const requests = await TutoringRequest.findAll({
      include: [
        { model: Teacher },
        { 
          model: Student,
          include: [
            { model: Teacher, as: 'R1' },
            { model: Teacher, as: 'R2' },
            { model: Teacher, as: 'RR' },
            { model: Teacher, as: 'R4' },
            { model: Teacher, as: 'R5' }
          ]
        }
      ]
    });
    
    res.json(requests);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/tutoring
// @desc    Create a new tutoring request
// @access  Private
router.post('/', auth, async (req, res) => {
  const { studentId, date, lunches } = req.body;
  
  try {
    // Check if student exists
    const student = await Student.findByPk(studentId);
    if (!student) {
      return res.status(404).json({ msg: 'Student not found' });
    }
    
    // Format the date
    const requestDate = new Date(date);
    requestDate.setHours(12,0,0,0);
    console.log(requestDate);
    
    // Check if there are existing requests for this student on the same day
    const existingRequests = await TutoringRequest.findAll({
      where: {
        StudentId: studentId,
        date: requestDate,
        status: 'active'
      },
      include: [{ model: Teacher }]
    });
    
    // If there are any existing requests, prevent this request (one teacher per student per day)
    if (existingRequests.length > 0) {
      const existingTeachers = existingRequests.map(req => req.Teacher.name);
      return res.status(400).json({ 
        msg: 'This student is already requested for this day',
        conflicts: [{
          type: 'full-day',
          teacherName: existingTeachers.join(', '),
          message: `Student already requested by ${existingTeachers.join(', ')} for this day`
        }]
      });
    }
    
    // Create new tutoring request
    const newRequest = await TutoringRequest.create({
      TeacherId: req.teacher.id,
      StudentId: studentId,
      date: requestDate,
      lunchA: lunches.A || false,
      lunchB: lunches.B || false,
      lunchC: lunches.C || false,
      lunchD: lunches.D || false
    });
    
    // Fetch the created request with associations
    const request = await TutoringRequest.findByPk(newRequest.id, {
      include: [
        { model: Teacher },
        { 
          model: Student,
          include: [
            { model: Teacher, as: 'R1' },
            { model: Teacher, as: 'R2' },
            { model: Teacher, as: 'RR' },
            { model: Teacher, as: 'R4' },
            { model: Teacher, as: 'R5' }
          ]
        }
      ]
    });
    
    res.json(request);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/tutoring/cancel/:id
// @desc    Cancel a tutoring request
// @access  Private
router.put('/cancel/:id', auth, async (req, res) => {
  try {
    const request = await TutoringRequest.findByPk(req.params.id);
    
    if (!request) {
      return res.status(404).json({ msg: 'Request not found' });
    }
    
    // Make sure the teacher who created the request is the one cancelling it
    if (request.TeacherId.toString() !== req.teacher.id) {
      return res.status(401).json({ msg: 'Not authorized to cancel this request' });
    }
    
    // Update to cancelled status
    request.status = 'cancelled';
    await request.save();
    
    res.json({ msg: 'Request cancelled successfully', request });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
