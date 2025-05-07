const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const auth = require('../middleware/auth');

// @route   GET api/students
// @desc    Get all students
// @access  Public
router.get('/', async (req, res) => {
  try {
    const students = await Student.findAll({
      include: [
        { model: Teacher, as: 'R1' },
        { model: Teacher, as: 'R2' },
        { model: Teacher, as: 'RR' },
        { model: Teacher, as: 'R4' },
        { model: Teacher, as: 'R5' }
      ]
    });
    res.json(students);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/students
// @desc    Add a new student
// @access  Public
router.post('/', async (req, res) => {
  const { name, teachers } = req.body;
  
  try {
    const studentData = {
      name,
      R1Id: teachers?.R1 || null,
      R2Id: teachers?.R2 || null,
      RRId: teachers?.RR || null,
      R4Id: teachers?.R4 || null,
      R5Id: teachers?.R5 || null
    };
    
    const student = await Student.create(studentData);
    
    // Fetch the student with teacher associations
    const newStudent = await Student.findByPk(student.id, {
      include: [
        { model: Teacher, as: 'R1' },
        { model: Teacher, as: 'R2' },
        { model: Teacher, as: 'RR' },
        { model: Teacher, as: 'R4' },
        { model: Teacher, as: 'R5' }
      ]
    });
    
    res.json(newStudent);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
