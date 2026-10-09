import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';
import apiService from '../utils/apiService';

const formatDate = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
};

const SmallTable = ({ head, children }) => (
  <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
    <Table size="small">
      <TableHead>
        <TableRow>
          {head.map(([label, align]) => <TableCell key={label} align={align}><strong>{label}</strong></TableCell>)}
        </TableRow>
      </TableHead>
      <TableBody>{children}</TableBody>
    </Table>
  </TableContainer>
);

// Every tutoring session for one student over the selected range: date,
// lunches, service minutes, tutoring teacher and subject - plus the minutes
// totalled by subject - for reporting SPED service minutes. Minutes are the
// sum of the booked lunch blocks (A/B/C 23, D 24; passing time not counted).
const StudentSessionsDialog = ({ student, range, loadDetail, onClose }) => {
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!student) return;
    let cancelled = false;
    setDetail(null);
    setError(null);
    loadDetail(student.id, range)
      .then(res => { if (!cancelled) setDetail(res.data); })
      .catch(err => { if (!cancelled) setError(apiService.formatError(err)); });
    return () => { cancelled = true; };
  }, [student, range, loadDetail]);

  const totals = detail?.student;

  return (
    <Dialog open={!!student} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>
        {student && `${student.last_name}, ${student.first_name}`}
        <Typography variant="body2" color="text.secondary">
          {formatDate(range.from)} – {formatDate(range.to)}
        </Typography>
      </DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error">{error}</Alert>}
        {!error && !detail && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}><CircularProgress size={28} /></Box>
        )}
        {detail && (
          <>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
              {totals.totalSessions} session{totals.totalSessions === 1 ? '' : 's'} · {totals.totalMinutes} minutes
            </Typography>

            {totals.bySubject.length > 0 && (
              <SmallTable head={[['Subject'], ['Sessions', 'right'], ['Minutes', 'right']]}>
                {totals.bySubject.map(s => (
                  <TableRow key={s.subject}>
                    <TableCell>{s.subject}</TableCell>
                    <TableCell align="right">{s.sessions}</TableCell>
                    <TableCell align="right">{s.minutes}</TableCell>
                  </TableRow>
                ))}
              </SmallTable>
            )}

            {detail.sessions.length === 0 ? (
              <Alert severity="info">No tutoring in this date range.</Alert>
            ) : (
              <SmallTable head={[['Date'], ['Lunch'], ['Minutes', 'right'], ['Teacher'], ['Subject']]}>
                {detail.sessions.map(s => (
                  <TableRow key={s.id}>
                    <TableCell>{formatDate(s.date)}</TableCell>
                    <TableCell>{s.lunches.join(', ')}</TableCell>
                    <TableCell align="right">{s.minutes}</TableCell>
                    <TableCell>{s.teacher}</TableCell>
                    <TableCell>{s.subject}</TableCell>
                  </TableRow>
                ))}
              </SmallTable>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default StudentSessionsDialog;
