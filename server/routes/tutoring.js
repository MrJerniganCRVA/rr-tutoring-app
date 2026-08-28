const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const TutoringRequest = require('../models/TutoringRequest');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Enrollment = require('../models/Enrollment');
const auth = require('../middleware/auth');
const { TEACHER_LEAN_ATTRS, STUDENT_LEAN_ATTRS } = require('../utils/enrollments');
const { resolveRRMainTeacherId, schoolYearStartDate, parseDateOnly } = require('../utils/tutoringScope');

// Only the RR enrollment is ever needed alongside a tutoring request (the
// "Leaving RR Today" board keys off it). Loading just that one period instead
// of all five is what keeps this query from fanning out to
// requests x enrollments rows and serializing every rotation teacher twice.
//
// `scope === 'rr'` turns the same include into the filter itself: an inner
// join restricted to one RR teacher, so the database does the scoping.
function buildRequestInclude(scope, rrMainTeacherId) {
  const isRR = scope === 'rr';
  return [
    { model: Teacher, attributes: TEACHER_LEAN_ATTRS },
    {
      model: Student,
      attributes: STUDENT_LEAN_ATTRS,
      required: isRR,
      include: [{
        model: Enrollment,
        attributes: ['id', 'period'],
        where: isRR ? { period: 'RR', TeacherId: rrMainTeacherId } : { period: 'RR' },
        required: isRR,
        include: [{ model: Teacher, attributes: TEACHER_LEAN_ATTRS }]
      }]
    }
  ];
}

// The shape every tutoring endpoint returns. Deliberately narrow: this is the
// full set of fields the client actually reads. Notably absent are the
// student's email and the rest of their schedule, which the old response
// included for every request in the database.
function toLeanRequest(requestInstance) {
  const data = requestInstance.toJSON ? requestInstance.toJSON() : requestInstance;
  const student = data.Student;
  const rrTeacher = (student?.Enrollments || []).find(e => e.period === 'RR')?.Teacher || null;
  const name = (person) => (person
    ? { id: person.id, first_name: person.first_name, last_name: person.last_name }
    : null);

  return {
    id: data.id,
    date: data.date,
    status: data.status,
    lunchA: data.lunchA,
    lunchB: data.lunchB,
    lunchC: data.lunchC,
    lunchD: data.lunchD,
    invite_sent: data.invite_sent,
    calendar_event_id: data.calendar_event_id,
    TeacherId: data.TeacherId,
    StudentId: data.StudentId,
    Teacher: name(data.Teacher),
    Student: student ? { ...name(student), RR: name(rrTeacher) } : null
  };
}

// Used by the POST handlers, which always return a single request to the
// teacher who just created it.
const OWN_REQUEST_INCLUDE = buildRequestInclude('mine', null);

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



// @route   GET api/tutoring/:id
// @desc    Get tutoring request by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
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
// @desc    Get tutoring requests, scoped to what the caller actually needs
// @access  Private
//
// Query params:
//   scope=mine    (default) the caller's own requests. Defaults to this school
//                 year so searching past requests by student name still works.
//   scope=rr      requests for students in the caller's Raptor Rotation,
//                 whoever booked them - the "Leaving RR Today" board.
//   scope=student requests for one student across all teachers, for the
//                 scheduling form's conflict check. Requires studentId.
//   from/to/date  'YYYY-MM-DD' bounds on the request date.
//   status        e.g. 'active'.
router.get('/', auth, async (req, res) => {
  try {
    const { scope = 'mine', from, to, date, studentId, status } = req.query;

    if (!['mine', 'rr', 'student'].includes(scope)) {
      return res.status(400).json({ msg: `Unknown scope '${scope}'` });
    }

    const where = {};
    if (scope === 'mine') {
      where.TeacherId = req.teacher.id;
    } else if (scope === 'student') {
      const id = parseInt(studentId, 10);
      if (Number.isNaN(id)) {
        return res.status(400).json({ msg: 'studentId is required for scope=student' });
      }
      where.StudentId = id;
    }

    if (status) where.status = status;

    const exactDate = parseDateOnly(date);
    const fromDate = parseDateOnly(from);
    const toDate = parseDateOnly(to);
    if ([exactDate, fromDate, toDate].includes(undefined)) {
      return res.status(400).json({ msg: 'Dates must be formatted YYYY-MM-DD' });
    }

    if (exactDate) {
      where.date = exactDate;
    } else {
      // Only a teacher's own history is bounded by default - the other scopes
      // are already narrow (one RR board, or one student).
      const lower = fromDate || (scope === 'mine' ? schoolYearStartDate() : null);
      if (lower || toDate) {
        where.date = {
          ...(lower && { [Op.gte]: lower }),
          ...(toDate && { [Op.lte]: toDate })
        };
      }
    }

    const rrMainTeacherId = scope === 'rr' ? resolveRRMainTeacherId(req.teacher.id) : null;

    const requests = await TutoringRequest.findAll({
      where,
      include: buildRequestInclude(scope, rrMainTeacherId),
      order: [['date', 'ASC']]
    });
    res.json(requests.map(toLeanRequest));
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
      const request = await TutoringRequest.findByPk(newRequest.id, { include: OWN_REQUEST_INCLUDE });
      return res.json(toLeanRequest(request));
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
            existingTeacher: `${existingTeacher.first_name} ${existingTeacher.last_name}`,
            existingSubject: existingTeacher.subject,
            canOverride: true,
            reason: `${requestingTeacher.subject} has priority on ${new Date(date).toLocaleDateString('en-US', {weekday: 'long'})}`
          },
          requireOverride: true
        });
      }
      //have confirmed override so cancel existing and create new
      existingRequest.status = 'cancelled';
      existingRequest.conflictReason = `Overriden by ${requestingTeacher.last_name}. Priority given`;
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
      const request = await TutoringRequest.findByPk(newRequest.id, { include: OWN_REQUEST_INCLUDE });

      return res.json({
        request: toLeanRequest(request),
        overrideInfo: {
          overriddenTeacher: `${existingTeacher.first_name} ${existingTeacher.last_name}`,
          overriddenSubject: existingTeacher.subject,
          reason: 'Priority day override'
        }
      });


    } else if (existHasPriority && !requestHasPriority){
      //exisiting teacher has priority deny request
       return res.status(403).json({
        msg: 'Request denied - existing teacher has priority for this day',
        conflict: {
          existingTeacher: `${existingTeacher.first_name} ${existingTeacher.last_name}`,
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
          existingTeacher: `${existingTeacher.first_name} ${existingTeacher.last_name}`,
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
          existingTeacher: `${existingTeacher.first_name} ${existingTeacher.last_name}`,
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
    if (request.TeacherId !== req.teacher.id) {
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
