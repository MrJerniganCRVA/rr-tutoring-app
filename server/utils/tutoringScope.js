// Helpers for scoping GET /api/tutoring. Everything here answers one of two
// questions: "whose RR board is this teacher allowed to see?" and "how far
// back should a teacher's own request history reach?".

// Several teachers share a single Raptor Rotation, which points at one "main"
// teacher. A request's student belongs to the main teacher's RR, so anyone in
// the group has to query under that id. This table used to live in the client
// (RaptorRotationEvents.js); it lives here now so the id is derived from the
// session rather than sent by the caller - a teacher can't ask for someone
// else's RR board.
const RR_GROUPS = {
  10025: 10006,
  10007: 10006,
  10010: 10001,
  10028: 10001,
  10008: 10023,
  10009: 10023,
  10024: 10005,
  10011: 10005,
  10012: 10023,
  10003: 10023
};

function resolveRRMainTeacherId(teacherId) {
  const id = parseInt(teacherId, 10);
  if (Number.isNaN(id)) return null;
  return RR_GROUPS[id] || id;
}

// School years run August-July, so anything on or after Aug 1 belongs to the
// year that just started. Used as the default lower bound on a teacher's own
// requests, which keeps "search my past requests by student name" working
// without shipping every year ever recorded.
function schoolYearStartDate(now = new Date()) {
  const AUGUST = 7; // zero-indexed
  const year = now.getMonth() >= AUGUST ? now.getFullYear() : now.getFullYear() - 1;
  return `${year}-08-01`;
}

// TutoringRequest.date is a DATEONLY, so it compares cleanly against
// 'YYYY-MM-DD' strings - no timezone shifting on the way in or out.
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

function parseDateOnly(value) {
  if (value === undefined || value === null || value === '') return null;
  if (!DATE_ONLY.test(value)) return undefined; // undefined = present but invalid
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? undefined : value;
}

module.exports = {
  RR_GROUPS,
  resolveRRMainTeacherId,
  schoolYearStartDate,
  parseDateOnly
};
