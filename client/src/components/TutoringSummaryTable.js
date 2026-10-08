import React from 'react';
import {
  Chip,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';

// Per-student tutoring totals, broken down by who did the tutoring. Rows come
// straight from /api/caseload or /api/admin/students/:id/tutoring:
//   { id, first_name, last_name, totalSessions, byTeacher: [{ teacherId, name, subject, sessions }] }
const TutoringSummaryTable = ({ students }) => (
  <TableContainer component={Paper} variant="outlined">
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell><strong>Student</strong></TableCell>
          <TableCell align="right"><strong>Sessions</strong></TableCell>
          <TableCell><strong>Tutored by</strong></TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {students.map(student => (
          <TableRow key={student.id}>
            <TableCell>{student.last_name}, {student.first_name}</TableCell>
            <TableCell align="right" sx={{ fontWeight: 600 }}>{student.totalSessions}</TableCell>
            <TableCell>
              {student.byTeacher.length === 0 ? (
                <Typography variant="body2" color="text.secondary">No tutoring in this date range</Typography>
              ) : (
                <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                  {student.byTeacher.map(t => (
                    <Chip
                      key={t.teacherId}
                      size="small"
                      variant="outlined"
                      label={`${t.name}${t.subject ? ` (${t.subject})` : ''} · ${t.sessions}`}
                    />
                  ))}
                </Stack>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);

export default TutoringSummaryTable;
