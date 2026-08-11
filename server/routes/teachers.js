const express = require('express');
const router = express.Router();
const Teacher = require('../models/Teacher');
const auth = require('../middleware/auth');

const SAFE_ATTRS = ['id', 'first_name', 'last_name', 'email', 'subject', 'lunch', 'is_admin', 'active'];

// Thrown for expected, client-facing failures so callers can respond 400 vs 500.
class TeacherInputError extends Error {}

async function requireAdmin(req) {
  const requestingTeacher = await Teacher.findByPk(req.teacher.id);
  if (!requestingTeacher?.is_admin) {
    throw Object.assign(new Error('Admin access required'), { status: 403 });
  }
  return requestingTeacher;
}

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
// @access  Admin only
router.post('/', auth, async (req, res) => {
  try {
    await requireAdmin(req);

    const { id, first_name, last_name, email, subject, lunch } = req.body;
    if (!id || !first_name || !last_name || !email || !subject) {
      return res.status(400).json({ msg: 'id, first_name, last_name, email, and subject are required' });
    }

    const id_exists = await Teacher.findByPk(id);
    if (id_exists) {
      return res.status(400).json({ msg: `Teacher ID ${id} already exists.` });
    }
    const email_exists = await Teacher.findOne({ where: { email } });
    if (email_exists) {
      return res.status(400).json({ msg: `A teacher with email ${email} already exists.` });
    }

    const teacher = await Teacher.create({ id, first_name, last_name, email, subject, lunch: lunch || null });
    res.json(teacher);
  } catch (err) {
    if (err.status === 403) return res.status(403).json({ msg: err.message });
    if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ msg: err.errors?.[0]?.message || 'Invalid teacher data.' });
    }
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/teachers/:id
// @desc    Update a teacher's editable fields
// @access  Admin only
router.put('/:id', auth, async (req, res) => {
  try {
    const requestingTeacher = await requireAdmin(req);

    const teacher = await Teacher.findByPk(req.params.id);
    if (!teacher) return res.status(404).json({ msg: 'Teacher not found' });

    const { first_name, last_name, email, subject, lunch, is_admin, active } = req.body;

    if (email !== undefined && email !== teacher.email) {
      const email_exists = await Teacher.findOne({ where: { email } });
      if (email_exists) {
        return res.status(400).json({ msg: `A teacher with email ${email} already exists.` });
      }
    }

    if (
      String(requestingTeacher.id) === String(req.params.id) &&
      is_admin === false
    ) {
      return res.status(400).json({ msg: 'You cannot remove your own admin access.' });
    }

    const updates = {};
    for (const [field, val] of Object.entries({ first_name, last_name, email, subject, lunch, is_admin, active })) {
      if (val !== undefined) updates[field] = val;
    }

    await teacher.update(updates);
    const updated = await Teacher.findByPk(req.params.id, { attributes: SAFE_ATTRS });
    res.json(updated);
  } catch (err) {
    if (err.status === 403) return res.status(403).json({ msg: err.message });
    if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ msg: err.errors?.[0]?.message || 'Invalid teacher data.' });
    }
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
