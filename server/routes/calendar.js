const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { upsertCalendarEvent } = require('../utils/calendarService');
const TutoringRequest = require('../models/TutoringRequest');
const Student = require('../models/Student');
const { Op } = require('sequelize');

// @route   POST /api/calendar/send-invites
// @desc    Create/update calendar invites for pending tutoring requests
// @access  Private
router.post('/send-invites', auth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all FUTURE tutoring requests for this teacher that haven't been sent yet
    const pendingRequests = await TutoringRequest.findAll({
      where: {
        TeacherId: req.teacher.id,
        date: {
          [Op.gte]: today // Only future dates
        },
        invite_sent: false // Only unsent invites
      },
      include: [
        { model: Student, attributes: ['id', 'first_name', 'last_name', 'email'] }
      ]
    });

    if (pendingRequests.length === 0) {
      return res.status(200).json({ 
        msg: 'All invites are up to date!',
        results: []
      });
    }

    // Group requests by date AND time slot
    const groupedByDateAndTime = groupByDateAndTimeSlot(pendingRequests);

    const results = [];

    // For each unique date+time combination
    for (const group of groupedByDateAndTime) {
      // Check if any request in this group already has a calendar event ID
      const existingEventId = group.requests.find(r => r.calendar_event_id)?.calendar_event_id;

      const eventDetails = {
        summary: `Tutoring - ${group.students.length} student(s)`,
        description: `Tutoring session with: ${group.students.map(s => `${s.first_name} ${s.last_name}`).join(', ')}`,
        startDateTime: group.startDateTime,
        endDateTime: group.endDateTime,
        attendees: group.students.map(student => ({
          email: student.email,
          displayName: `${student.first_name} ${student.last_name}`
        }))
      };

      // Create or update the event
      const event = await upsertCalendarEvent(req.teacher.id, eventDetails, existingEventId);

      // Mark all requests in this group as sent and store the event ID
      for (const request of group.requests) {
        await request.update({
          invite_sent: true,
          invite_sent_at: new Date(),
          calendar_event_id: event.id
        });
      }

      results.push({
        action: existingEventId ? 'updated' : 'created',
        eventId: event.id,
        date: group.date,
        timeSlot: group.timeSlot,
        studentCount: group.students.length
      });
    }

    res.json({
      msg: `Processed ${results.length} calendar event(s)`,
      results: results
    });

  } catch (err) {
    console.error('Error creating calendar invites:', err);
    res.status(500).json({ 
      error: 'Failed to create calendar invites',
      details: err.message 
    });
  }
});

// @route   GET /api/calendar/pending-count
// @desc    Get count of pending invites for this teacher
// @access  Private
router.get('/pending-count', auth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const count = await TutoringRequest.count({
      where: {
        TeacherId: req.teacher.id,
        date: {
          [Op.gte]: today
        },
        invite_sent: false
      }
    });

    res.json({ pendingCount: count });
  } catch (err) {
    console.error('Error getting pending count:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Helper: Group requests by date AND time slot
function groupByDateAndTimeSlot(requests) {
  const groups = {};

  requests.forEach(request => {
    const lunchPeriods = [];
    if (request.lunchA) lunchPeriods.push('A');
    if (request.lunchB) lunchPeriods.push('B');
    if (request.lunchC) lunchPeriods.push('C');
    if (request.lunchD) lunchPeriods.push('D');

    lunchPeriods.forEach(lunch => {
      const timeSlot = getLunchTimeSlot(lunch, request.date);
      const key = `${request.date}-${timeSlot.start}-${timeSlot.end}`;

      if (!groups[key]) {
        groups[key] = {
          date: request.date,
          timeSlot: lunch,
          startDateTime: timeSlot.start,
          endDateTime: timeSlot.end,
          students: [],
          requests: []
        };
      }

      // Only add student if not already in this group
      if (!groups[key].students.find(s => s.id === request.Student.id)) {
        groups[key].students.push(request.Student);
      }
      
      groups[key].requests.push(request);
    });
  });

  return Object.values(groups);
}

// Helper: Get time slot for lunch period
function getLunchTimeSlot(lunchPeriod, date) {
  // TODO: Update these times to match your actual school schedule
  const times = {
    'A': { start: '11:02', end: '11:25' },
    'B': { start: '11:28', end: '11:51' },
    'C': { start: '11:54', end: '12:17' },
    'D': { start: '12:20', end: '12:44' }
  };

  const time = times[lunchPeriod];
  
  return {
    start: `${date}T${time.start}:00-05:00`, // ISO format with EST timezone
    end: `${date}T${time.end}:00-05:00`
  };
}
module.exports = router;