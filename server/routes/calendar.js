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

    // Get ALL future tutoring requests for this teacher (sent and unsent) so that
    // already-sent requests can provide their calendar_event_id when adding new
    // students to an existing event, and so all attendees are included on updates.
    const allRequests = await TutoringRequest.findAll({
      where: {
        TeacherId: req.teacher.id,
        date: {
          [Op.gte]: today // Only future dates
        }
      },
      include: [
        { model: Student, attributes: ['id', 'first_name', 'last_name', 'email'] }
      ]
    });

    // Early-exit only when nothing is pending (avoids processing fully-sent groups)
    const anyPending = allRequests.some(r => !r.invite_sent);
    if (!anyPending) {
      return res.status(200).json({
        msg: 'All invites are up to date!',
        results: []
      });
    }

    // Group ALL requests by date AND time slot (merging contiguous lunches).
    // Including sent requests ensures: (a) their calendar_event_id is discoverable,
    // and (b) their students are included in the attendee list so they aren't dropped
    // when Google Calendar replaces the attendee list on an update.
    const groupedByDateAndTime = groupByDateAndTimeSlot(allRequests);

    const results = [];

    // For each unique date+time combination
    for (const group of groupedByDateAndTime) {
      // Skip groups where every request has already been sent
      const pendingInGroup = group.requests.filter(r => !r.invite_sent);
      if (pendingInGroup.length === 0) continue;

      // Find existing event ID from any request in this group (sent or unsent)
      const existingEventId = group.requests.find(r => r.calendar_event_id)?.calendar_event_id;

      // Exclude students whose requests are manually marked (invite_sent=true, calendar_event_id=null)
      // so the app never sends a duplicate Google Calendar invite for teacher-handled students.
      const manuallyMarkedStudentIds = new Set(
        group.requests
          .filter(r => r.invite_sent && !r.calendar_event_id)
          .map(r => r.Student.id)
      );
      const groupAttendees = group.students
        .filter(s => !manuallyMarkedStudentIds.has(s.id))
        .map(student => ({
          email: student.email,
          displayName: `${student.first_name} ${student.last_name}`
        }));

      // If every student in this group was manually marked, skip the Google Calendar call
      if (groupAttendees.length === 0) continue;

      const eventDetails = {
        summary: `RR Tutoring - ${req.user.subject}`,
        description: `Tutoring session today during Raptor Rotation.`,
        startDateTime: group.startDateTime,
        endDateTime: group.endDateTime,
        // Include all non-manually-marked students so existing attendees are not dropped
        attendees: groupAttendees
      };

      // Create or update the event
      const event = await upsertCalendarEvent(req.teacher.id, eventDetails, existingEventId);

      // Only mark previously-unsent requests as sent; avoid clobbering already-sent records
      for (const request of pendingInGroup) {
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
        studentCount: groupAttendees.length
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

// @route   PATCH /api/calendar/mark-sent/:id
// @desc    Manually mark a tutoring request as invite-sent (teacher handled it outside the app)
// @access  Private
router.patch('/mark-sent/:id', auth, async (req, res) => {
  try {
    const request = await TutoringRequest.findOne({
      where: { id: req.params.id, TeacherId: req.teacher.id }
    });

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    await request.update({ invite_sent: true, invite_sent_at: new Date() });
    res.json({ message: 'Marked as manually sent', request });
  } catch (err) {
    console.error('Error marking invite as sent:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PATCH /api/calendar/unmark-sent/:id
// @desc    Undo a manual mark (only allowed when no Google Calendar event is attached)
// @access  Private
router.patch('/unmark-sent/:id', auth, async (req, res) => {
  try {
    const request = await TutoringRequest.findOne({
      where: { id: req.params.id, TeacherId: req.teacher.id }
    });

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (request.calendar_event_id) {
      return res.status(400).json({ error: 'Cannot unmark an invite that was sent via the app' });
    }

    await request.update({ invite_sent: false, invite_sent_at: null });
    res.json({ message: 'Invite unmarked', request });
  } catch (err) {
    console.error('Error unmarking invite:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Helper: Group requests by date AND merge ONLY contiguous lunch periods
function groupByDateAndTimeSlot(requests) {
  const groups = {};

  requests.forEach(request => {
    const lunchPeriods = [];
    if (request.lunchA) lunchPeriods.push('A');
    if (request.lunchB) lunchPeriods.push('B');
    if (request.lunchC) lunchPeriods.push('C');
    if (request.lunchD) lunchPeriods.push('D');

    // Break into contiguous chunks
    const chunks = getContiguousChunks(lunchPeriods);

    chunks.forEach(chunk => {
      const timeSlot = getMergedTimeSlot(chunk, request.date);
      const key = `${request.date}-${timeSlot.start}-${timeSlot.end}`;

      if (!groups[key]) {
        groups[key] = {
          date: request.date,
          timeSlot: chunk.join('+'), // e.g., "A", "A+B", "B+C+D"
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

// Helper: Break lunch periods into contiguous chunks
// Example: ['A', 'B', 'D'] becomes [['A', 'B'], ['D']]
function getContiguousChunks(lunchPeriods) {
  if (lunchPeriods.length === 0) return [];
  
  const order = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 };
  const sorted = [...lunchPeriods].sort((a, b) => order[a] - order[b]);
  
  const chunks = [];
  let currentChunk = [sorted[0]];
  
  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const previous = sorted[i - 1];
    
    // Check if contiguous (e.g., A->B is contiguous, A->C is not)
    if (order[current] === order[previous] + 1) {
      currentChunk.push(current);
    } else {
      // Gap detected, start new chunk
      chunks.push(currentChunk);
      currentChunk = [current];
    }
  }
  
  // Don't forget the last chunk
  chunks.push(currentChunk);
  return chunks;
}

// Helper: Get merged time slot spanning multiple lunch periods
function getMergedTimeSlot(lunchPeriods, date) {
  // TODO: Update these times to match your actual school schedule
  const times = {
    'A': { start: '11:02', end: '11:25' },
    'B': { start: '11:28', end: '11:51' },
    'C': { start: '11:54', end: '12:17' },
    'D': { start: '12:20', end: '12:44' }
  };

  // Get earliest start time
  const firstLunch = lunchPeriods[0];
  const startTime = times[firstLunch].start;

  // Get latest end time
  const lastLunch = lunchPeriods[lunchPeriods.length - 1];
  const endTime = times[lastLunch].end;

  return {
    start: `${date}T${startTime}:00-05:00`, // ISO format with EST timezone
    end: `${date}T${endTime}:00-05:00`
  };
}

module.exports = router;
