import React, { useCallback, useEffect, useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';
import apiService from '../utils/apiService';
import { todayDateOnly } from '../utils/dates';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

// Same palette as TeacherDashboard so the two pages read as one app.
const BLUE = '#249DD7';
const PINK = '#EC3984';
const GREEN = '#8FC745';
const LIGHT_BLUE = '#79C1F1';
const PALETTE = [BLUE, PINK, GREEN, LIGHT_BLUE, '#F2A93B', '#8E6CCF'];
const withAlpha = (hex, a) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: 'top' } }
};
// Bar/line charts count whole sessions, so no 0.5-style ticks.
const noLegend = {
  ...chartOptions,
  plugins: { legend: { display: false } },
  scales: { x: { ticks: { precision: 0 } }, y: { ticks: { precision: 0 } } }
};

const barData = (labels, values, color, label = 'Sessions') => ({
  labels,
  datasets: [{ label, data: values, backgroundColor: withAlpha(color, 0.8), borderColor: color, borderWidth: 2 }]
});

const StatCard = ({ label, value, color }) => (
  <Card sx={{ borderTop: 4, borderColor: color, height: '100%' }}>
    <CardContent sx={{ textAlign: 'center' }}>
      <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600 }}>
        {label}
      </Typography>
      <Typography variant="h3" sx={{ color, fontWeight: 'bold', my: 1 }}>
        {value}
      </Typography>
    </CardContent>
  </Card>
);

const ChartCard = ({ title, height = 320, children }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Typography variant="h6" sx={{ mb: 2, pb: 1, borderBottom: 2, borderColor: '#D0E9FA' }}>
        {title}
      </Typography>
      <Box sx={{ height, position: 'relative' }}>{children}</Box>
    </CardContent>
  </Card>
);

// School year runs August-July, matching the server's default range.
const schoolYearStart = () => {
  const now = new Date();
  const year = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
  return `${year}-08-01`;
};

// Just what an admin needs at a glance: whose priority day it is, and how
// many students will be moving around. A student can only be booked once a
// day, so the student count is also the session count.
const TodaySection = ({ today }) => (
  <>
    <Grid container spacing={3} sx={{ mb: 3 }}>
      <Grid item xs={12} sm={6}>
        <StatCard label="Priority today" value={today.prioritySubject || 'No tutoring'} color={PINK} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <StatCard label="Students leaving RR" value={today.uniqueStudents} color={GREEN} />
      </Grid>
    </Grid>

    <Typography variant="h6" sx={{ mb: 1 }}>Leaving RR Today, by RR</Typography>
    {today.leavingByRR.length === 0 && <Alert severity="info">No one is leaving RR for tutoring today.</Alert>}
    {today.leavingByRR.map(group => {
      const uniqueStudents = new Set(group.students.map(s => s.studentId)).size;
      return (
        <Accordion key={group.rrTeacher?.id ?? 'none'} disableGutters>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap' }}>
              <Typography sx={{ fontWeight: 600 }}>
                {group.rrTeacher ? group.rrTeacher.name : 'No RR assigned'}
              </Typography>
              {group.sharedWith.length > 0 && (
                <Typography variant="body2" color="text.secondary">
                  (with {group.sharedWith.join(', ')})
                </Typography>
              )}
              <Chip size="small" label={`${uniqueStudents} student${uniqueStudents === 1 ? '' : 's'}`} />
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Student</TableCell>
                  <TableCell>Tutoring Teacher</TableCell>
                  <TableCell>Lunch</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {group.students.map(s => (
                  <TableRow key={s.requestId}>
                    <TableCell>{s.studentName}</TableCell>
                    <TableCell>{s.tutoringTeacher}</TableCell>
                    <TableCell>{s.lunches.join(', ')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </AccordionDetails>
        </Accordion>
      );
    })}
  </>
);

const TrendsSection = ({ trends }) => {
  const departments = Object.keys(trends.byDepartment);
  const topTeachers = trends.byTeacher.slice(0, 15);
  const weekLabel = (iso) => {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  const cancelled = trends.byStatus.cancelled || 0;

  return (
    <>
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <StatCard label="Total sessions" value={trends.totalSessions} color={BLUE} />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard label="Students tutored" value={trends.uniqueStudents} color={GREEN} />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard label="Student never tutored" value={trends.activeStudentsWithoutSessions} color={PINK} />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard label="Cancelled / overridden" value={cancelled} color={LIGHT_BLUE} />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <ChartCard title="Sessions per Week" height={280}>
            <Line
              data={{
                labels: trends.byWeek.map(w => weekLabel(w.week)),
                datasets: [{
                  label: 'Sessions',
                  data: trends.byWeek.map(w => w.sessions),
                  borderColor: BLUE,
                  backgroundColor: withAlpha(BLUE, 0.2),
                  tension: 0.25
                }]
              }}
              options={noLegend}
            />
          </ChartCard>
        </Grid>
        <Grid item xs={12} md={6}>
          <ChartCard title="Sessions by Department">
            <Pie
              data={{
                labels: departments,
                datasets: [{
                  data: Object.values(trends.byDepartment),
                  backgroundColor: departments.map((_, i) => withAlpha(PALETTE[i % PALETTE.length], 0.8)),
                  borderColor: departments.map((_, i) => PALETTE[i % PALETTE.length]),
                  borderWidth: 2
                }]
              }}
              options={chartOptions}
            />
          </ChartCard>
        </Grid>
        <Grid item xs={12} md={6}>
          <ChartCard title="Sessions by Grade Level">
            <Bar data={barData(Object.keys(trends.byGradeLevel), Object.values(trends.byGradeLevel), GREEN)} options={noLegend} />
          </ChartCard>
        </Grid>
        <Grid item xs={12} md={6}>
          <ChartCard title="Sessions by Day of Week">
            <Bar data={barData(Object.keys(trends.byDayOfWeek), Object.values(trends.byDayOfWeek), BLUE)} options={noLegend} />
          </ChartCard>
        </Grid>
        <Grid item xs={12} md={6}>
          <ChartCard title={`Sessions by Teacher${trends.byTeacher.length > 15 ? ' (top 15)' : ''}`}>
            <Bar
              data={barData(topTeachers.map(t => t.name), topTeachers.map(t => t.sessions), PINK)}
              options={{
                ...noLegend,
                indexAxis: 'y',
                plugins: {
                  ...noLegend.plugins,
                  tooltip: {
                    callbacks: {
                      afterLabel: (ctx) => `${topTeachers[ctx.dataIndex].subject} · ${topTeachers[ctx.dataIndex].percentile}th percentile`
                    }
                  }
                }
              }}
            />
          </ChartCard>
        </Grid>
      </Grid>
    </>
  );
};

const AdminDashboard = () => {
  const [today, setToday] = useState(null);
  const [trends, setTrends] = useState(null);
  const [range, setRange] = useState({ from: schoolYearStart(), to: todayDateOnly() });
  const [error, setError] = useState(null);

  useEffect(() => {
    apiService.getAdminToday()
      .then(res => setToday(res.data))
      .catch(err => setError(apiService.formatError(err)));
  }, []);

  const loadTrends = useCallback(() => {
    setTrends(null);
    apiService.getAdminTrends(range)
      .then(res => setTrends(res.data))
      .catch(err => setError(apiService.formatError(err)));
  }, [range]);

  useEffect(() => { loadTrends(); }, [loadTrends]);

  const loading = <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>;

  return (
    <Box sx={{ p: { xs: 0, md: 3 }, maxWidth: 1400, mx: 'auto' }}>
      <Typography variant="h4" sx={{ fontWeight: 600, mb: 3 }}>Admin Dashboard</Typography>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Typography variant="h5" sx={{ mb: 2 }}>
        Today{today && ` — ${new Date(`${today.date}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`}
      </Typography>
      {today ? <TodaySection today={today} /> : !error && loading}

      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ md: 'center' }} spacing={2} sx={{ mt: 5, mb: 2 }}>
        <Typography variant="h5">School-wide Trends</Typography>
        <Stack direction="row" spacing={2}>
          <TextField
            type="date"
            size="small"
            label="From"
            value={range.from}
            onChange={e => e.target.value && setRange(r => ({ ...r, from: e.target.value }))}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            type="date"
            size="small"
            label="To"
            value={range.to}
            onChange={e => e.target.value && setRange(r => ({ ...r, to: e.target.value }))}
            InputLabelProps={{ shrink: true }}
          />
        </Stack>
      </Stack>
      {trends ? <TrendsSection trends={trends} /> : !error && loading}
    </Box>
  );
};

export default AdminDashboard;
