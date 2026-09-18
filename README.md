# RR Tutoring Scheduler

A comprehensive web application for managing tutoring programs in educational institutions. This system streamlines the scheduling and tracking of tutoring sessions between teachers and students across different academic periods.

## Features

### For Teachers
- **Teacher Dashboard** - View assigned students and tutoring schedules
- **Session Management** - Create and manage tutoring requests
- **Student Tracking** - Monitor student progress across different class periods
- **Priority Scheduling** - Day-of-week subject priority with conflict detection and override. Overriding another teacher warns you first and names them; confirming it notifies them and withdraws the student from their calendar invite
- **Teacher Analytics** - Look at data about your tutoring sessions

### For Admins
- **Student & Teacher Rosters** - Add, edit, and manage student and teacher records
- **Bulk CSV Import** - Onboard students or teachers in bulk, and bulk-update RR assignments

### System Features
- **Real-time Updates** - Live data synchronization
- **Data Persistence** - Reliable PostgreSQL database storage

## Tech Stack

### Frontend
- **React** - User interface framework
- **Material-UI (MUI)** - Component library for modern design
- **React Router** - Client-side routing

### Backend
- **Node.js** - JavaScript runtime environment
- **Express.js** - Web application framework
- **Sequelize ORM** - Database object-relational mapping
- **PostgreSQL** - Production database
- **SQLite** - Local development database

### Deployment & Infrastructure
- **Railway** - Cloud deployment platform
- **Git** - Version control
- **Environment Variables** - Secure configuration management

## Project Structure

```
rr-tutoring-app/
├── client/                 # React frontend application
│   ├── public/            # Static files and HTML template
│   ├── src/
│   │   ├── components/    # React components (pages and UI)
│   │   ├── contexts/      # React context providers (auth, tutoring, analytics)
│   │   ├── utils/         # API client and shared helpers
│   │   └── App.js         # Main application component + routes
│   └── package.json       # Frontend dependencies
├── server/                # Node.js backend application
│   ├── config/            # Database and Passport (OAuth) configuration
│   ├── models/            # Sequelize data models
│   ├── routes/            # API endpoint definitions
│   ├── middleware/        # Custom middleware functions
│   ├── utils/             # Shared server-side helpers
│   └── server.js          # Express server setup
└── README.md               # Project documentation
```

## Database Schema

### Teachers
- ID (Primary Key, not auto-generated — assigned explicitly)
- First Name, Last Name, Email, Subject, Lunch (A/B/C/D)
- Google OAuth fields: `google_id`, `access_token`, `refresh_token`, `token_expiry`
- `is_admin` — grants access to the Roster admin pages
- `active` — for marking a teacher inactive without deleting their record

### Students
- ID (Primary Key, student ID — not auto-generated)
- First Name, Last Name, Email
- `schoolYear`, `active` — for tracking/retiring students across years

### Enrollments
Join table linking Students to Teachers for a given class period. A student can have any number of enrollments — not just the five original rotation periods (`R1`, `R2`, `RR`, `R4`, `R5`); a `period` value can be any label (e.g. an online class). At most one teacher per period per student.
- Student ID, Teacher ID (Foreign Keys), `period` (string label), `schoolYear`

### Tutoring Requests
- Student ID, Teacher ID (Foreign Keys)
- Date, per-lunch-period flags (A/B/C/D)
- `status` (active/cancelled/conflict), `priority`, `conflictReason`
- Google Calendar invite tracking (`calendar_event_id`, `invite_sent`, `invite_sent_at`)

### Notifications
In-app messages addressed to a teacher. Written when a priority-day override cancels
a booking they made — the only case where the app takes a session away from the teacher
who scheduled it, and otherwise invisible to them since every list view hides cancelled rows.
- Teacher ID (the **recipient**), Student ID (Foreign Keys)
- `type`, `message` (rendered at write time), `relatedDate`, `read`, `readAt`

The overriding teacher is named inside `message` rather than stored as a second
foreign key, mirroring how `conflictReason` records them on the cancelled request.

## 🔧 API Endpoints

All routes below require an authenticated session (Google OAuth) unless noted; admin-only routes additionally require `is_admin`.

### Auth
- `GET /auth/google` - Start Google OAuth login
- `GET /auth/google/callback` - OAuth callback
- `GET /auth/current` - Get the current logged-in teacher
- `GET /auth/logout` - Log out

### Teachers
- `GET /api/teachers` - Get all teachers
- `GET /api/teachers/:id` - Get a specific teacher
- `POST /api/teachers` - Create a new teacher (admin only)
- `POST /api/teachers/bulk-create` - Bulk-create teachers from a CSV import (admin only)
- `PUT /api/teachers/:id` - Update a teacher's fields (admin only)

### Students
- `GET /api/students` - Get all students
- `GET /api/students/teacher/:teacherId` - Get all students enrolled with a given teacher, in any period
- `POST /api/students` - Create a new student
- `POST /api/students/bulk-create` - Bulk-create students from a CSV import (admin only)
- `POST /api/students/bulk-rr` - Bulk-update RR (homeroom) assignments (admin only)
- `PUT /api/students/:id` - Update a student's class enrollments (admin only)

### Tutoring
- `GET /api/tutoring` - Get all tutoring requests
- `GET /api/tutoring/:id` - Get a specific tutoring request
- `POST /api/tutoring` - Create a tutoring request (handles priority-day conflicts; pass `override: true` to confirm an override)
- `GET /api/tutoring/priority/:date` - Check which subject has scheduling priority on a given date
- `PUT /api/tutoring/cancel/:id` - Cancel a tutoring request

Priority days: **Mon** CS, **Tue** Math, **Thu** Humanities, **Fri** Science. No tutoring
Wednesdays or weekends. A teacher whose subject owns the day can override a booking made
by a teacher whose subject does not; any other collision is first come, first served.
An override cancels the incumbent's request, creates a `Notification` for them, and removes
the student from the incumbent's Google Calendar event (deleting the event outright if that
student was its only attendee).

### Notifications
- `GET /api/notifications` - The caller's own notifications, newest first (`?unread=true` to filter)
- `PATCH /api/notifications/:id/read` - Mark one notification as read
- `PATCH /api/notifications/read-all` - Mark all of the caller's notifications as read

### Analytics
- `GET /api/analytics/:teacherId` - Get a teacher's personal + school-wide session analytics
- `GET /api/analytics/:teacherId/student/:studentId` - Get a teacher's session history with a specific student

### Calendar
- `POST /api/calendar/send-invites` - Send pending Google Calendar invites for the teacher's tutoring requests
- `GET /api/calendar/pending-count` - Count of tutoring requests awaiting a calendar invite
- `PATCH /api/calendar/mark-sent/:id` / `PATCH /api/calendar/unmark-sent/:id` - Manually mark a request's invite as sent/unsent

## Developer

**Mr. Jernigan**  
- GitHub: [@MrJerniganCRVA](https://github.com/MrJerniganCRVA)

## Acknowledgments

- Built for educational institutions to improve tutoring program management
- Special thanks to the open-source community for the excellent tools and libraries
- Thank you to all the teachers who have provided feedback.

---

*This project demonstrates full-stack web development skills including React frontend development, Node.js backend architecture, database design, API development, and cloud deployment.*
