import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  CircularProgress
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';
import apiService from '../utils/apiService';

function exportCSV(students) {
  const header = 'student_id,student_name,rr_teacher';
  const rows = students.map(s => {
    const name = `${s.last_name} ${s.first_name}`;
    const rr = s.RR?.last_name ?? '';
    return `${s.id},${name},${rr}`;
  });
  const csv = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'rr_assignments.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function parseCSV(text, students, teachers) {
  const studentById = {};
  for (const s of students) studentById[String(s.id)] = s;

  const teacherByLastName = {};
  for (const t of teachers) {
    const key = t.last_name.toLowerCase();
    if (!teacherByLastName[key]) teacherByLastName[key] = [];
    teacherByLastName[key].push(t);
  }

  const lines = text.trim().split(/\r?\n/);
  const dataLines = lines[0].toLowerCase().startsWith('student_id') ? lines.slice(1) : lines;

  return dataLines
    .filter(line => line.trim() !== '')
    .map((line, idx) => {
      const csvRowNum = idx + 2;
      const parts = line.split(',');
      if (parts.length < 3) {
        return { csvRowNum, status: 'error', reason: 'Invalid row format (expected 3 columns)' };
      }
      const studentId = parts[0].trim();
      const rrLastName = parts[2].trim();

      if (!studentId) {
        return { csvRowNum, status: 'error', reason: 'Missing student ID' };
      }

      const student = studentById[studentId];
      if (!student) {
        return { csvRowNum, studentId, rrLastName, status: 'error_student_not_found', reason: `Student ID "${studentId}" not found` };
      }

      if (!rrLastName) {
        return { csvRowNum, studentId, student, status: 'error', reason: 'Missing RR teacher name' };
      }

      const matches = teacherByLastName[rrLastName.toLowerCase()];
      if (!matches || matches.length === 0) {
        return { csvRowNum, studentId, student, rrLastName, status: 'error_teacher_not_found', reason: `Teacher "${rrLastName}" not found` };
      }
      if (matches.length > 1) {
        return { csvRowNum, studentId, student, rrLastName, status: 'error_teacher_ambiguous', reason: `Multiple teachers with last name "${rrLastName}" — use Edit to update manually` };
      }

      const newTeacher = matches[0];
      if (student.RRId !== null && String(student.RRId) === String(newTeacher.id)) {
        return { csvRowNum, studentId, student, rrLastName, newTeacher, currentRR: student.RR, status: 'no_change' };
      }

      return { csvRowNum, studentId, student, rrLastName, newTeacher, currentRR: student.RR, status: 'ok' };
    });
}

const STATUS_CONFIG = {
  ok: { label: 'Will update', color: 'success' },
  no_change: { label: 'No change', color: 'default' },
  error_student_not_found: { label: 'Student not found', color: 'error' },
  error_teacher_not_found: { label: 'Teacher not found', color: 'error' },
  error_teacher_ambiguous: { label: 'Ambiguous teacher', color: 'warning' },
  error: { label: 'Error', color: 'error' }
};

const BulkRRUpdate = ({ open, onClose, onComplete, students, teachers }) => {
  const [step, setStep] = useState(1);
  const [parsedRows, setParsedRows] = useState([]);
  const [parseError, setParseError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  const fileInputRef = useRef();

  const reset = () => {
    setStep(1);
    setParsedRows([]);
    setParseError('');
    setSubmitting(false);
    setSubmitResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setParseError('');
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const rows = parseCSV(evt.target.result, students, teachers);
        if (rows.length === 0) {
          setParseError('No data rows found in the CSV file.');
          return;
        }
        setParsedRows(rows);
        setStep(2);
      } catch (err) {
        setParseError('Failed to parse CSV file. Please check the format.');
      }
    };
    reader.readAsText(file);
  };

  const handleConfirm = async () => {
    const updates = parsedRows
      .filter(r => r.status === 'ok')
      .map(r => ({ studentId: r.studentId, rrTeacherId: r.newTeacher.id }));
    setSubmitting(true);
    setParseError('');
    try {
      const res = await apiService.bulkUpdateRR(updates);
      setSubmitResult(res.data);
      setStep(3);
    } catch (err) {
      setParseError(err.response?.data?.msg || 'Failed to submit updates.');
    } finally {
      setSubmitting(false);
    }
  };

  const okRows = parsedRows.filter(r => r.status === 'ok');
  const noChangeRows = parsedRows.filter(r => r.status === 'no_change');
  const errorRows = parsedRows.filter(r => r.status.startsWith('error'));
  const previewRows = [...okRows, ...errorRows];

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>

      {/* Step 1 — Upload */}
      {step === 1 && (
        <>
          <DialogTitle>Bulk RR Update — Step 1: Upload CSV</DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ mb: 1.5 }}>
              Upload a CSV file with updated RR teacher assignments. The file must have three columns:
            </Typography>
            <Paper variant="outlined" sx={{ p: 1.5, mb: 2, fontFamily: 'monospace', fontSize: '0.8rem', bgcolor: 'grey.50', whiteSpace: 'pre' }}>
              {'student_id,student_name,rr_teacher\n123456789,Doe John,Smith\n987654321,Smith Jane,Johnson'}
            </Paper>
            <Typography variant="body2" sx={{ mb: 2 }}>
              <strong>Tip:</strong> Export the current assignments first, update the <code>rr_teacher</code> column in Google Sheets, then re-upload. The <code>student_name</code> column is ignored on upload.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={() => exportCSV(students)}
              >
                Export current assignments
              </Button>
              <Button
                variant="contained"
                component="label"
                startIcon={<UploadFileIcon />}
              >
                Choose CSV file
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  hidden
                  onChange={handleFileChange}
                />
              </Button>
            </Box>
            {parseError && <Alert severity="error">{parseError}</Alert>}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
          </DialogActions>
        </>
      )}

      {/* Step 2 — Preview */}
      {step === 2 && (
        <>
          <DialogTitle>Bulk RR Update — Step 2: Review Changes</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
              <Chip label={`${okRows.length} will update`} color="success" size="small" />
              <Chip label={`${noChangeRows.length} no change`} color="default" size="small" />
              {errorRows.length > 0 && (
                <Chip label={`${errorRows.length} error${errorRows.length !== 1 ? 's' : ''}`} color="error" size="small" />
              )}
            </Box>
            {previewRows.length === 0 ? (
              <Alert severity="info">All rows are unchanged — nothing to update.</Alert>
            ) : (
              <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 360 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Student</strong></TableCell>
                      <TableCell><strong>Current RR</strong></TableCell>
                      <TableCell><strong>New RR</strong></TableCell>
                      <TableCell><strong>Status</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {previewRows.map((row, i) => {
                      const cfg = STATUS_CONFIG[row.status] || { label: row.status, color: 'default' };
                      return (
                        <TableRow key={i}>
                          <TableCell>
                            {row.student
                              ? `${row.student.first_name} ${row.student.last_name}`
                              : row.studentId}
                          </TableCell>
                          <TableCell>{row.currentRR?.last_name ?? '—'}</TableCell>
                          <TableCell>{row.newTeacher?.last_name ?? row.rrLastName ?? '—'}</TableCell>
                          <TableCell>
                            <Chip label={cfg.label} color={cfg.color} size="small" />
                            {row.reason && (
                              <Typography variant="caption" display="block" color="text.secondary">
                                Row {row.csvRowNum}: {row.reason}
                              </Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
            {parseError && <Alert severity="error" sx={{ mt: 2 }}>{parseError}</Alert>}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => { setStep(1); if (fileInputRef.current) fileInputRef.current.value = ''; }}>
              Re-upload
            </Button>
            <Button onClick={handleClose} disabled={submitting}>Cancel</Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleConfirm}
              disabled={okRows.length === 0 || submitting}
              startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : null}
            >
              {submitting ? 'Updating…' : `Confirm (${okRows.length} update${okRows.length !== 1 ? 's' : ''})`}
            </Button>
          </DialogActions>
        </>
      )}

      {/* Step 3 — Results */}
      {step === 3 && submitResult && (
        <>
          <DialogTitle>Bulk RR Update — Done</DialogTitle>
          <DialogContent>
            <Alert
              severity={submitResult.failed.length === 0 ? 'success' : 'warning'}
              sx={{ mb: submitResult.failed.length > 0 ? 2 : 0 }}
            >
              {submitResult.succeeded.length} assignment{submitResult.succeeded.length !== 1 ? 's' : ''} updated
              {submitResult.failed.length > 0 && ` · ${submitResult.failed.length} failed`}
            </Alert>
            {submitResult.failed.length > 0 && (
              <>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Failures:</Typography>
                {submitResult.failed.map((f, i) => (
                  <Typography key={i} variant="body2" color="error">
                    Student ID {f.studentId}: {f.reason}
                  </Typography>
                ))}
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button variant="contained" onClick={() => { handleClose(); onComplete(); }}>
              Close
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
};

export default BulkRRUpdate;
