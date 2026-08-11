const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const auth = require('../middleware/auth');
const {Op} = require('sequelize');

//New comment

const TEACHER_PUBLIC_ATTRS = ['id', 'first_name', 'last_name', 'subject', 'lunch'];

// @route   GET api/students/teacher/:teacherId
// @desc    Get all students for a specific teacher
// @access  Private
router.get('/teacher/:teacherId', auth, async (req, res) => {
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
        { model: Teacher, as: 'R1', attributes: TEACHER_PUBLIC_ATTRS },
        { model: Teacher, as: 'R2', attributes: TEACHER_PUBLIC_ATTRS },
        { model: Teacher, as: 'RR', attributes: TEACHER_PUBLIC_ATTRS },
        { model: Teacher, as: 'R4', attributes: TEACHER_PUBLIC_ATTRS },
        { model: Teacher, as: 'R5', attributes: TEACHER_PUBLIC_ATTRS }
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
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const students = await Student.findAll({
      include: [
        { model: Teacher, as: 'R1', attributes: TEACHER_PUBLIC_ATTRS },
        { model: Teacher, as: 'R2', attributes: TEACHER_PUBLIC_ATTRS },
        { model: Teacher, as: 'RR', attributes: TEACHER_PUBLIC_ATTRS },
        { model: Teacher, as: 'R4', attributes: TEACHER_PUBLIC_ATTRS },
        { model: Teacher, as: 'R5', attributes: TEACHER_PUBLIC_ATTRS }
      ]
    });

    const lunchStudents = addLunch(students);
    res.json(lunchStudents);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Thrown for expected, client-facing failures (bad input, duplicates) so callers
// can distinguish them from unexpected server errors and respond 400 vs 500.
class StudentInputError extends Error {}

// Shared creation logic used by both the single-student and bulk-import routes.
async function createStudentRecord({ id, first_name, last_name, email, R1Id, R2Id, RRId, R4Id, R5Id }) {
  const id_exists = await Student.findByPk(id);
  if (id_exists) {
    throw new StudentInputError(`Student ID ${id} already exists.`);
  }
  const name_exists = await Student.findOne({ where: { first_name, last_name } });
  if (name_exists) {
    throw new StudentInputError('Student already exists. Consider Updating instead of POST');
  }
  try {
    return await Student.create({ id, first_name, last_name, email, R1Id, R2Id, RRId, R4Id, R5Id });
  } catch (err) {
    if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
      throw new StudentInputError(err.errors?.[0]?.message || 'Invalid student data.');
    }
    throw err;
  }
}

// @route   POST api/students
// @desc    Add a new student
// @access  Private
router.post('/', auth, async (req, res) => {
  const { id, first_name, last_name, email, teachers } = req.body;
  try {
    const student = await createStudentRecord({
      id,
      first_name,
      last_name,
      email,
      R1Id: teachers?.R1 || null,
      R2Id: teachers?.R2 || null,
      RRId: teachers?.RR || null,
      R4Id: teachers?.R4 || null,
      R5Id: teachers?.R5 || null
    });
    // Fetch the student with teacher associations
    const newStudent = await Student.findByPk(student.id, {
      include: [
        { model: Teacher, as: 'R1', attributes: TEACHER_PUBLIC_ATTRS },
        { model: Teacher, as: 'R2', attributes: TEACHER_PUBLIC_ATTRS },
        { model: Teacher, as: 'RR', attributes: TEACHER_PUBLIC_ATTRS },
        { model: Teacher, as: 'R4', attributes: TEACHER_PUBLIC_ATTRS },
        { model: Teacher, as: 'R5', attributes: TEACHER_PUBLIC_ATTRS }
      ]
    });

    res.json(newStudent);
  } catch (err) {
    if (err instanceof StudentInputError) {
      return res.status(400).json({ msg: err.message });
    }
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/students/bulk-create
// @desc    Bulk-create students (e.g. onboarding a new year's population from CSV)
// @access  Admin only
router.post('/bulk-create', auth, async (req, res) => {
  try {
    const requestingTeacher = await Teacher.findByPk(req.teacher.id);
    if (!requestingTeacher?.is_admin) {
      return res.status(403).json({ msg: 'Admin access required' });
    }

    const { students } = req.body;
    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ msg: 'students array is required' });
    }

    const succeeded = [];
    const failed = [];

    for (const studentData of students) {
      try {
        const student = await createStudentRecord(studentData);
        succeeded.push(student.id);
      } catch (rowErr) {
        if (!(rowErr instanceof StudentInputError)) {
          console.error(rowErr.message);
        }
        failed.push({ studentId: studentData.id, reason: rowErr.message });
      }
    }

    res.json({ succeeded, failed });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/students/bulk-rr
// @desc    Bulk update RR teacher assignments
// @access  Admin only
router.post('/bulk-rr', auth, async (req, res) => {
  try {
    const requestingTeacher = await Teacher.findByPk(req.teacher.id);
    if (!requestingTeacher?.is_admin) {
      return res.status(403).json({ msg: 'Admin access required' });
    }

    const { updates } = req.body;
    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ msg: 'updates array is required' });
    }

    const succeeded = [];
    const failed = [];

    for (const { studentId, rrTeacherId } of updates) {
      try {
        const student = await Student.findByPk(studentId);
        if (!student) {
          failed.push({ studentId, reason: 'Student not found' });
          continue;
        }
        await student.update({ RRId: rrTeacherId });
        succeeded.push(studentId);
      } catch (rowErr) {
        failed.push({ studentId, reason: rowErr.message });
      }
    }

    res.json({ succeeded, failed });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/students/:id
// @desc    Update a student's teacher assignments
// @access  Admin only
router.put('/:id', auth, async (req, res) => {
  try {
    const requestingTeacher = await Teacher.findByPk(req.teacher.id);
    if (!requestingTeacher?.is_admin) {
      return res.status(403).json({ msg: 'Admin access required' });
    }

    const student = await Student.findByPk(req.params.id);
    if (!student) return res.status(404).json({ msg: 'Student not found' });

    const { R1Id, R2Id, RRId, R4Id, R5Id } = req.body;
    const updates = {};
    for (const [field, val] of Object.entries({ R1Id, R2Id, RRId, R4Id, R5Id })) {
      if (val !== undefined) {
        if (val !== null) {
          const exists = await Teacher.findByPk(val);
          if (!exists) return res.status(400).json({ msg: `Teacher ${val} not found` });
        }
        updates[field] = val;
      }
    }

    await student.update(updates);

    const updated = await Student.findByPk(req.params.id, {
      include: [
        { model: Teacher, as: 'R1', attributes: TEACHER_PUBLIC_ATTRS },
        { model: Teacher, as: 'R2', attributes: TEACHER_PUBLIC_ATTRS },
        { model: Teacher, as: 'RR', attributes: TEACHER_PUBLIC_ATTRS },
        { model: Teacher, as: 'R4', attributes: TEACHER_PUBLIC_ATTRS },
        { model: Teacher, as: 'R5', attributes: TEACHER_PUBLIC_ATTRS }
      ]
    });
    const result = updated.toJSON();
    result.lunch = updated.RR?.lunch ?? null;
    res.json(result);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
