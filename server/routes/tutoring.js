const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const TutoringRequest = require('../models/TutoringRequest');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const auth = require('../middleware/auth');

const getPrioritySubjectForDay = (date) => {
  let dateObj; 
  if(typeof date === 'string'){
    const [year, month, day] = date.split('-').map(num => parseInt(num, 10));
    dateObj = new Date(year, month - 1, day);
  } else {
    dateObj = new Date(date);
  }
  const dayOfWeek = dateObj.getDay()
  const priorityMap = {
    0: null,
    1: 'CS',
    2: 'Math',
    3: null,
    4: 'Humanities',
    5: 'Science',
    6: null
  };
  return priorityMap[dayOfWeek];
};
const hasSubjectPriority = (teacherSubject, date) =>{
  const prioritySubject = getPrioritySubjectForDay(date);
  return teacherSubject === prioritySubject;
};



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
  const { studentId, date, lunches, override = false } = req.body;

  try {
    //Check if priority allows
      let dateObj; 
      if(typeof date === 'string'){
        const [year, month, day] = date.split('-').map(num => parseInt(num, 10));
        dateObj = new Date(year, month - 1, day);
      } else {
        dateObj = new Date(date);
      }
    const dayOfWeek = dateObj.getDay();
    if(dayOfWeek ===3 || dayOfWeek === 0 || dayOfWeek===6){
      return res.status(400).json({msg:'No tutoring allowed on given date'});
    }
    // Check if student exists
    const student = await Student.findByPk(studentId);
    if (!student) {
      return res.status(404).json({ msg: 'Student not found' });
    }
    
    //Check if teacher exists
    const requestingTeacher = await Teacher.findByPk(req.teacher.id);
    if(!requestingTeacher){
      return res.status(404).json({msg:'Teacher not found'});
    }

    // Check if there are existing requests for this student on the same day
    const existingRequests = await TutoringRequest.findAll({
      where: {
        StudentId: studentId,
        date: dateObj,
        status: 'active'
      },
      include: [{ model: Teacher }],
      raw:false
    });
    
    //if no requests on that date make request normally
    if(existingRequests.length === 0){
      const newRequest = await TutoringRequest.create({
        TeacherId: req.teacher.id,
        StudentId: studentId,
        date: dateObj,
        lunchA: lunches.A || false,
        lunchB: lunches.B || false,
        lunchC: lunches.C || false,
        lunchD: lunches.D || false,
        priority: hasSubjectPriority(requestingTeacher.subject, date) ? 1 :0
      });
      //Fetch the created request
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
      return res.json(request); 
    }
    //a conflict exists need to figure out who has priority
    
    const existingRequest = existingRequests[0];
    const existingTeacher = existingRequest.dataValues.Teacher;
    const requestHasPriority = hasSubjectPriority(requestingTeacher.dataValues.subject, date);
    const existHasPriority = hasSubjectPriority(existingTeacher.dataValues.subject, date);

    //priority logic
    if(requestHasPriority && !existHasPriority){
      //request has priority and existing does not so need to override
      if(!override){
        //teacher hasn't confirmed override yet sending override confirmation
        return res.status(409).json({
          msg:'Student already requested by another teacher, but you have priority',
          conflict:{
            existingTeacher: existingTeacher.name,
            existingSubject: existingTeacher.subject,
            canOverride: true,
            reason: `${requestingTeacher.subject} has priority on ${new Date(date).toLocaleDateString('en-US', {weekday: 'long'})}`
          },
          requireOverride: true
        });
      }
      //have confirmed override so cancel existing and create new
      existingRequest.status = 'cancelled';
      existingRequest.conflictReason = `Overriden by ${requestingTeacher.name}. Priority given`;
      await existingRequest.save();

      const newRequest = await TutoringRequest.create({
        TeacherId: req.teacher.id,
        StudentId: studentId,
        date: dateObj,
        lunchA: lunches.A || false,
        lunchB: lunches.B || false,
        lunchC: lunches.C || false,
        lunchD: lunches.D || false,
        priority: 1 // Has priority
      });
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
      
      return res.json({
        request,
        overrideInfo: {
          overriddenTeacher: existingTeacher.name,
          overriddenSubject: existingTeacher.subject,
          reason: 'Priority day override'
        }
      });


    } else if (existHasPriority && !requestHasPriority){
      //exisiting teacher has priority deny request
       return res.status(403).json({
        msg: 'Request denied - existing teacher has priority for this day',
        conflict: {
          existingTeacher: existingTeacher.name,
          existingSubject: existingTeacher.subject,
          canOverride: false,
          reason: `${existingTeacher.subject} has priority on ${new Date(date).toLocaleDateString('en-US', { weekday: 'long' })}s`
        }
      });
    } else if (requestHasPriority && existHasPriority){
      //both teachers have priority - first one there gets the student
      return res.status(400).json({
        msg: 'Student already requested by another teacher from the same priority subject',
        conflict: {
          existingTeacher: existingTeacher.name,
          existingSubject: existingTeacher.subject,
          canOverride: false,
          reason: `Both teachers have ${requestingTeacher.subject} priority for this day`
        }
      });
    } else {
      //neither has priority so the first gets the student
      return res.status(400).json({ 
        msg: 'Student already requested by another teacher',
        conflict: {
          existingTeacher: existingTeacher.name,
          existingSubject: existingTeacher.subject,
          canOverride: false,
          reason: 'First come, first served (no priority subjects involved)'
        }
      });
    }
    

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});
//@route  POST api/tutoring/override
//@desc   Handle Override requests
//@access  Private
router.post('/override', auth, async (req, res) => {
  // same as regular POST but with override = true
  req.body.override = true;
  return router.post('/', auth)(req, res);
});

//@route   GET api/priority/:date
//@desc    Helper route to check what subject has priroity 
//@access  
router.get('/priority/:date', (req, res) => {
  const { date } = req.params;
  let dateObj;
  if (typeof date === 'string') {
    const [year, month, day] = date.split('-').map(num => parseInt(num, 10));
    dateObj = new Date(year, month - 1, day);
  } else {
    dateObj = new Date(date);
  }


  const dayOfWeek = dateObj.getDay();
  const prioritySubject = getPrioritySubjectForDay(dateObj);
  const dayName = dateObj.toLocaleDateString('en-US', {weekday: 'long'});
  
  if (!prioritySubject) {
    return res.json({
      date,
      dateObject: dateObj.toDateString(),
      dayOfWeek: dayOfWeek,
      dayName,
      prioritySubject: null,
      message: dayOfWeek === 3 ? 'No tutoring on Wednesdays' : 'No tutoring on Weekends'
    });
  }
  
  res.json({
    date,
    dayName,
    prioritySubject,
    message: `${prioritySubject} has priority on ${dayName}s`
  });
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
