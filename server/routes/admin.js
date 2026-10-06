const express = require('express');
const router = express.Router();
const { Readable } = require('stream');
const { Op } = require('sequelize');
const sequelize = require('../config/db');
const TutoringRequest = require('../models/TutoringRequest');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const { buildRequestInclude, toLeanRequest, getPrioritySubjectForDay } = require('../utils/tutoringQueries');
const {
  RR_GROUPS,
  schoolYearStartDate,
  schoolTodayDateOnly,
  parseDateOnly
} = require('../utils/tutoringScope');

// Everything in this file is mounted behind auth + requireAdmin in server.js.

const LUNCHES = ['A', 'B', 'C', 'D'];
const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const fullName = (p) => (p ? `${p.first_name} ${p.last_name}` : 'Unknown');

// 'YYYY-MM-DD' -> local-midnight Date, so getDay() is the calendar weekday
// rather than whatever UTC midnight happens to be in the server's zone.
function dateFromDateOnly(value) {
  const str = value instanceof Date ? value.toISOString().split('T')[0] : String(value);
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// Monday of the week containing `date`, as 'YYYY-MM-DD'. Tutoring only runs on
// weekdays, so labelling weeks by their Monday reads naturally.
function weekStart(date) {
  const d = new Date(date);
  const offset = (d.getDay() + 6) % 7; // Mon=0 ... Sun=6
  d.setDate(d.getDate() - offset);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Student ids start with the two-digit year they entered (e.g. 25xxxx), the
// same rule the Kotlin report's Student.getGradeLevel uses.
function gradeLevel(studentId, schoolYearStart) {
  const startYear = parseInt(String(studentId).slice(0, 2), 10);
  const years = (schoolYearStart % 100) - startYear;
  return ['9th', '10th', '11th', '12th'][years] || 'Other';
}

// Teachers who share an RR with `mainId` (see RR_GROUPS), so the admin view
// can show who the board actually belongs to.
function rrGroupMemberIds(mainId) {
  return Object.entries(RR_GROUPS)
    .filter(([, main]) => main === mainId)
    .map(([member]) => Number(member));
}

// @route   GET api/admin/today
// @desc    Everything happening in tutoring today, school-wide
// @access  Admin
router.get('/today', async (req, res) => {
  try {
    const today = schoolTodayDateOnly();
    const requests = await TutoringRequest.findAll({
      where: { date: today, status: 'active' },
      include: buildRequestInclude('mine', null),
      order: [['id', 'ASC']]
    });
    const lean = requests.map(toLeanRequest);

    // The lean include only carries names; departments come from one lookup.
    const teacherIds = [...new Set(lean.map(r => r.TeacherId))];
    const teachers = await Teacher.findAll({
      where: { id: teacherIds },
      attributes: ['id', 'subject'],
      raw: true
    });
    const subjectById = Object.fromEntries(teachers.map(t => [t.id, t.subject]));

    const byLunch = Object.fromEntries(LUNCHES.map(l => [l, 0]));
    const byDepartment = {};
    for (const r of lean) {
      for (const l of LUNCHES) if (r[`lunch${l}`]) byLunch[l]++;
      const subject = subjectById[r.TeacherId] || 'Unknown';
      byDepartment[subject] = (byDepartment[subject] || 0) + 1;
    }

    // Group by the student's RR (the main teacher students are enrolled under).
    const groups = new Map();
    for (const r of lean) {
      const rr = r.Student?.RR;
      const key = rr ? rr.id : 'none';
      if (!groups.has(key)) {
        groups.set(key, { rrTeacher: rr ? { id: rr.id, name: fullName(rr) } : null, students: [] });
      }
      groups.get(key).students.push({
        requestId: r.id,
        studentId: r.StudentId,
        studentName: fullName(r.Student),
        tutoringTeacher: fullName(r.Teacher),
        lunches: LUNCHES.filter(l => r[`lunch${l}`])
      });
    }

    const memberIds = [...groups.values()]
      .filter(g => g.rrTeacher)
      .flatMap(g => rrGroupMemberIds(g.rrTeacher.id));
    const members = memberIds.length
      ? await Teacher.findAll({ where: { id: memberIds }, attributes: ['id', 'first_name', 'last_name'], raw: true })
      : [];
    const memberNameById = Object.fromEntries(members.map(m => [m.id, fullName(m)]));

    const leavingByRR = [...groups.values()]
      .map(g => ({
        ...g,
        sharedWith: g.rrTeacher
          ? rrGroupMemberIds(g.rrTeacher.id).map(id => memberNameById[id]).filter(Boolean)
          : [],
        students: g.students.sort((a, b) => a.studentName.localeCompare(b.studentName))
      }))
      .sort((a, b) => (a.rrTeacher?.name || '~').localeCompare(b.rrTeacher?.name || '~'));

    res.json({
      date: today,
      prioritySubject: getPrioritySubjectForDay(today),
      totalSessions: lean.length,
      uniqueStudents: new Set(lean.map(r => r.StudentId)).size,
      byLunch,
      byDepartment,
      leavingByRR
    });
  } catch (err) {
    console.error('Admin today error:', err);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/admin/trends
// @desc    School-wide trends over a date range (defaults to this school year)
// @access  Admin
//
// The same measures as the Kotlin Excel report, served live. Aggregation runs
// in SQL down to per-day / per-teacher / per-student rows, and the calendar
// bucketing (weeks, weekdays, grades) happens here so it behaves identically
// on SQLite in development and Postgres in production.
router.get('/trends', async (req, res) => {
  try {
    const fromParam = parseDateOnly(req.query.from);
    const toParam = parseDateOnly(req.query.to);
    if (fromParam === undefined || toParam === undefined) {
      return res.status(400).json({ msg: 'Dates must be formatted YYYY-MM-DD' });
    }
    const from = fromParam || schoolYearStartDate();
    const to = toParam || schoolTodayDateOnly();
    const dateRange = { [Op.between]: [from, to] };
    const activeInRange = { status: 'active', date: dateRange };
    const count = [sequelize.fn('COUNT', sequelize.col('TutoringRequest.id')), 'count'];

    const [perDay, perTeacher, perStudent, perStatus, activeStudentCount] = await Promise.all([
      TutoringRequest.findAll({
        where: activeInRange,
        attributes: ['date', count],
        group: ['date'],
        raw: true
      }),
      TutoringRequest.findAll({
        where: activeInRange,
        attributes: ['TeacherId', count],
        include: [{ model: Teacher, attributes: ['first_name', 'last_name', 'subject'] }],
        group: ['TeacherId', 'Teacher.id', 'Teacher.first_name', 'Teacher.last_name', 'Teacher.subject'],
        raw: true
      }),
      TutoringRequest.findAll({
        where: activeInRange,
        attributes: ['StudentId', count],
        group: ['StudentId'],
        raw: true
      }),
      TutoringRequest.findAll({
        where: { date: dateRange },
        attributes: ['status', count],
        group: ['status'],
        raw: true
      }),
      Student.count({ where: { active: true } })
    ]);

    const byWeek = {};
    const byDayOfWeek = Object.fromEntries(WEEKDAYS.map(d => [d, 0]));
    let totalSessions = 0;
    for (const row of perDay) {
      const n = parseInt(row.count, 10);
      const date = dateFromDateOnly(row.date);
      totalSessions += n;
      const week = weekStart(date);
      byWeek[week] = (byWeek[week] || 0) + n;
      const dayName = WEEKDAYS[date.getDay() - 1];
      if (dayName) byDayOfWeek[dayName] += n;
    }

    const byDepartment = {};
    const teacherRows = perTeacher.map(row => {
      const sessions = parseInt(row.count, 10);
      const subject = row['Teacher.subject'] || 'Unknown';
      byDepartment[subject] = (byDepartment[subject] || 0) + sessions;
      return {
        teacherId: row.TeacherId,
        name: `${row['Teacher.first_name']} ${row['Teacher.last_name']}`,
        subject,
        sessions
      };
    });
    // Percentile = share of teachers with fewer sessions (matches the report).
    const sortedCounts = teacherRows.map(t => t.sessions).sort((a, b) => a - b);
    const byTeacher = teacherRows
      .map(t => ({
        ...t,
        percentile: Math.floor((sortedCounts.indexOf(t.sessions) / sortedCounts.length) * 100)
      }))
      .sort((a, b) => b.sessions - a.sessions);

    const yearStart = parseInt(schoolYearStartDate(dateFromDateOnly(to)).slice(0, 4), 10);
    const byGradeLevel = { '9th': 0, '10th': 0, '11th': 0, '12th': 0, Other: 0 };
    for (const row of perStudent) {
      byGradeLevel[gradeLevel(row.StudentId, yearStart)] += parseInt(row.count, 10);
    }

    const tutoredIds = perStudent.map(r => r.StudentId);
    const activeStudentsTutored = tutoredIds.length
      ? await Student.count({ where: { active: true, id: tutoredIds } })
      : 0;

    res.json({
      from,
      to,
      totalSessions,
      uniqueStudents: perStudent.length,
      activeStudentsWithoutSessions: activeStudentCount - activeStudentsTutored,
      byStatus: Object.fromEntries(perStatus.map(r => [r.status, parseInt(r.count, 10)])),
      byWeek: Object.keys(byWeek).sort().map(week => ({ week, sessions: byWeek[week] })),
      byDayOfWeek,
      byDepartment,
      byTeacher,
      byGradeLevel
    });
  } catch (err) {
    console.error('Admin trends error:', err);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/admin/report
// @desc    Run the Kotlin Excel report and stream the .xlsx back
// @access  Admin
//
// The report lives in its own Railway service (tutoring-analytics-report),
// reachable only over the project's private network and guarded by a shared
// token. That service sleeps when idle, so the first request after a quiet
// spell includes a JVM cold start - hence the generous timeout.
router.get('/report', async (req, res) => {
  const baseUrl = process.env.REPORT_SERVICE_URL;
  const token = process.env.REPORT_TOKEN;
  if (!baseUrl || !token) {
    return res.status(503).json({
      msg: 'The report service is not configured. Set REPORT_SERVICE_URL and REPORT_TOKEN on the server.'
    });
  }

  try {
    const upstream = await fetch(`${baseUrl.replace(/\/+$/, '')}/report`, {
      headers: { 'X-Report-Token': token },
      signal: AbortSignal.timeout(120_000)
    });
    if (!upstream.ok || !upstream.body) {
      console.error('Report service responded', upstream.status);
      return res.status(502).json({ msg: `The report service failed (HTTP ${upstream.status}).` });
    }

    const filename = `tutoring_report_${schoolTodayDateOnly()}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-store');
    Readable.fromWeb(upstream.body).pipe(res);
  } catch (err) {
    console.error('Report service error:', err.message);
    const timedOut = err.name === 'TimeoutError';
    res.status(timedOut ? 504 : 502).json({
      msg: timedOut ? 'The report took too long to generate.' : 'Could not reach the report service.'
    });
  }
});

module.exports = router;
