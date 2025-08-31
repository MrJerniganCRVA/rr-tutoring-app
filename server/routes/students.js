const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const auth = require('../middleware/auth');
const {Op} = require('sequelize');

//New comment

// @route   GET api/students/teacher/:teacherId
// @desc    Get all students for a specific teacher
// @access  Public
router.get('/teacher/:teacherId', async (req, res) => {
  try {
    const teacherId = req.params.teacherId;
    // Find all students where this teacher is listed in any of the teaching slots
    const students = await Student.findAll({
      where: {
        [Op.or]: [
          { R1Id: teacherId },
          { R2Id: teacherId },
          { RRId: teacherId },
          { R4Id: teacherId },
          { R5Id: teacherId }
        ]
      },
      include: [
        { model: Teacher, as: 'R1' },
        { model: Teacher, as: 'R2' },
        { model: Teacher, as: 'RR' },
        { model: Teacher, as: 'R4' },
        { model: Teacher, as: 'R5' }
      ]
    });
    const lunchStudents = addLunch(students);
    res.json(lunchStudents);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

function addLunch(students){
  const newStudents = students.map(student =>{
    const data = student.toJSON();
    data.lunch = student.RR ? student.RR.lunch : null;
    return data;
  });
  return newStudents;
}
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

    const lunchStudents = addLunch(students);
    res.json(lunchStudents);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/students
// @desc    Add a new student
// @access  Public
router.post('/', async (req, res) => {
  const { first_name, last_name, teachers } = req.body;
  try{
    await sequelize.query("SELECT * FROM Student LIMIT 1",
      {type:sequelize.QueryTypes.SELECT}
    );
  } catch (err){
    await Student.sync({force: false});
  }
  try {
    const studentData = {
      first_name,
      last_name,
      R1Id: teachers?.R1 || null,
      R2Id: teachers?.R2 || null,
      RRId: teachers?.RR || null,
      R4Id: teachers?.R4 || null,
      R5Id: teachers?.R5 || null
    };
    
    let student_exists = await Student.findOne({ where: { first_name:first_name, last_name:last_name } });
    if (student_exists) {
      return res.status(400).json({ msg: 'Student already exists. Consider Updating instead of POST' });
    }
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
