const { Op } = require('sequelize');
const sequelize = require('../config/db');
const Teacher = require('../models/Teacher');
const TutoringRequest = require('../models/TutoringRequest');
const Student = require('../models/Student');
const Enrollment = require('../models/Enrollment');
const { TEACHER_LEAN_ATTRS, STUDENT_LEAN_ATTRS } = require('./enrollments');

// Query shapes shared by routes/tutoring.js and routes/admin.js, so the admin
// views return exactly the same request shape the teacher views do.

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

// Per-student tutoring totals over a date range, broken down by the teacher
// who did the tutoring. Backs the SPED caseload page and the admin student
// lookup. Counts active sessions only, matching every other count in the app.
// Every requested id gets an entry, so a student never tutored shows 0.
async function summarizeTutoring(studentIds, from, to) {
  const summary = new Map(studentIds.map(id => [id, { totalSessions: 0, byTeacher: [] }]));
  if (studentIds.length === 0) return summary;

  const rows = await TutoringRequest.findAll({
    where: { StudentId: studentIds, status: 'active', date: { [Op.between]: [from, to] } },
    attributes: ['StudentId', 'TeacherId', [sequelize.fn('COUNT', sequelize.col('TutoringRequest.id')), 'count']],
    include: [{ model: Teacher, attributes: ['first_name', 'last_name', 'subject'] }],
    group: ['StudentId', 'TeacherId', 'Teacher.id', 'Teacher.first_name', 'Teacher.last_name', 'Teacher.subject'],
    raw: true
  });

  for (const row of rows) {
    const entry = summary.get(row.StudentId);
    if (!entry) continue;
    const sessions = parseInt(row.count, 10);
    entry.totalSessions += sessions;
    entry.byTeacher.push({
      teacherId: row.TeacherId,
      name: `${row['Teacher.first_name']} ${row['Teacher.last_name']}`,
      subject: row['Teacher.subject'],
      sessions
    });
  }
  for (const entry of summary.values()) {
    entry.byTeacher.sort((a, b) => b.sessions - a.sessions || a.name.localeCompare(b.name));
  }
  return summary;
}

module.exports = {
  summarizeTutoring,
  buildRequestInclude,
  toLeanRequest,
  OWN_REQUEST_INCLUDE,
  getPrioritySubjectForDay,
  hasSubjectPriority
};
