const express = require('express');
const router = express.Router();
const Teacher = require('../models/Teacher');
const auth = require('../middleware/auth');

const SAFE_ATTRS = ['id', 'first_name', 'last_name', 'email', 'subject', 'lunch', 'is_admin'];

// @route   GET api/teachers
// @desc    Get all teachers
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const teachers = await Teacher.findAll({
      attributes: SAFE_ATTRS,
      order: [['last_name', 'ASC'], ['first_name', 'ASC']]
    });
    res.json(teachers);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/teachers/:id
// @desc    Get teacher by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const teacher = await Teacher.findByPk(req.params.id, { attributes: SAFE_ATTRS });
    
    if (!teacher) {
      return res.status(404).json({ msg: 'Teacher not found' });
    }
    
    res.json(teacher);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/teachers
// @desc    Add a new teacher
// @access  Public
router.post('/', auth, async (req, res) => {
  try{
    const {first_name, last_name, email, subject, lunch} = req.body;
    // Check if teacher already exists
    let teacher = await Teacher.findOne({ where: { email } });
    
    if (teacher) {
      return res.status(400).json({ msg: 'Teacher already exists' });
    }
    
    // Create teacher
    teacher = await Teacher.create({
      first_name,
      last_name,
      email,
      subject,
      lunch
    });
    
    res.json(teacher);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
