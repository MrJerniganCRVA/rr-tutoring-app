# RR Tutoring Scheduler

A comprehensive web application for managing tutoring programs in educational institutions. This system streamlines the scheduling and tracking of tutoring sessions between teachers and students across different academic periods.

## Features

### For Teachers
- **Teacher Dashboard** - View assigned students and tutoring schedules
- **Session Management** - Create and manage tutoring requests
- **Student Tracking** - Monitor student progress across different periods (R1, R2, RR, R4, R5)
- **Bulk Operations** - Handle multiple tutoring sessions efficiently

### For Administrators
- **Student Management** - Add and organize student information
- **Teacher Profiles** - Manage teacher assignments and subjects
- **Data Import** - Bulk import students and teachers via CSV
- **Session Overview** - Track all tutoring activities

### System Features
- **Real-time Updates** - Live data synchronization
- **Data Persistence** - Reliable PostgreSQL database storage

## Tech Stack

### Frontend
- **React** - User interface framework
- **Material-UI (MUI)** - Component library for modern design
- **React Router** - Client-side routing
- **Axios** - HTTP client for API communication

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
│   │   ├── components/    # Reusable React components
│   │   ├── pages/         # Main application pages
│   │   └── App.js         # Main application component
│   └── package.json       # Frontend dependencies
├── server/                # Node.js backend application
│   ├── config/           # Database configuration
│   ├── models/           # Sequelize data models
│   ├── routes/           # API endpoint definitions
│   ├── middleware/       # Custom middleware functions
│   └── server.js         # Express server setup
└── README.md            # Project documentation
```


## Deployment

This application is deployed on Railway with automatic builds from the main branch.


## Database Schema

### Teachers
- ID (Primary Key)
- First Name
- Last Name
- Subject
- Email
- Created/Updated timestamps

### Students  
- ID (Primary Key, 9-digit student ID)
- First Name
- Last Name
- Teacher Associations (R1, R2, RR, R4, R5)
- Created/Updated timestamps

### Tutoring Sessions
- ID (Primary Key)
- Student ID (Foreign Key)
- Teacher ID (Foreign Key)
- Session Date
- Lunches
- Status
- Notes

## 🔧 API Endpoints

### Teachers
- `GET /api/teachers` - Retrieve all teachers
- `POST /api/teachers` - Create new teacher
- `GET /api/teachers/:id` - Get specific teacher

### Students
- `GET /api/students` - Retrieve all students
- `POST /api/students` - Create new student
- `GET /api/students/:id` - Get specific student

### Tutoring
- `GET /api/tutoring` - Retrieve all tutoring sessions
- `POST /api/tutoring` - Create new tutoring session
- `PUT /api/tutoring/:id` - Update tutoring session
- `DELETE /api/tutoring/:id` - Delete tutoring session

## 📈 Future Enhancements

- [ ] Email notifications for tutoring sessions
- [ ] Calendar integration
- [ ] Advanced reporting and analytics

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Developer

**Mr. Jernigan**  
- GitHub: [@MrJerniganCRVA](https://github.com/MrJerniganCRVA)

## Acknowledgments

- Built for educational institutions to improve tutoring program management
- Special thanks to the open-source community for the excellent tools and libraries
- Thank you to all the teachers have provided feedback.

---

*This project demonstrates full-stack web development skills including React frontend development, Node.js backend architecture, database design, API development, and cloud deployment.*
