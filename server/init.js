// init.js
const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

// Define database path
const dbPath = path.join(__dirname, 'database.sqlite');

// Delete the existing database file if it exists
if (fs.existsSync(dbPath)) {
  console.log('Removing existing database...');
  fs.unlinkSync(dbPath);
}

const sequelize = require('./config/db')

// Define models
const Teacher = require('./models/Teacher');
const Student = require('./models/Student');
const TutoringRequest = require('./models/TutoringRequest');

// Function to initialize database and add test data
async function initDatabase() {
  try {
    // Sync models to create tables
    await sequelize.sync({ force: true });
    console.log('Database initialized successfully');

    // Create sample teachers
    const teachers = await Teacher.bulkCreate([
      {
        id: 1,
        first_name: 'Alice',
        last_name:'Johnson',
        email: 'ajohnson@school.edu',
        subject: 'Math',
        lunch: 'A'
      },
      {
        id: 2,
        first_name: 'Bob',
        last_name: 'Smith',
        email: 'bsmith@school.edu',
        subject: 'Humanities',
        lunch: 'B'
      },
      {
        id: 3,
        first_name: 'Carol',
        last_name: 'Williams',
        email: 'cwilliams@school.edu',
        subject: 'Science',
        lunch: 'C'
      },
      {
        id: 4,
        first_name: 'David',
        last_name: 'Locke',
        email: 'dlocke@school.edu',
        subject: 'CS',
        lunch: 'D'
      }
    ]);

    console.log('Sample teachers created');

    // Get the teacher IDs
    const teacherIds = teachers.map(teacher => teacher.id);
    
    // Create sample students with random teacher assignments
    const students = [];
    
    const firstNames = ['Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Ethan', 'Sophia', 'Lucas', 'Isabella', 'Mason'];
    const lastNames = ['Smith', 'Johnson', 'Brown', 'Davis', 'Wilson', 'Miller', 'Taylor', 'Anderson', 'Thomas', 'Jackson'];
    const grades = ['9', '10', '11', '12'];
    
    for (let i = 0; i < 10; i++) {
      const firstName = firstNames[i % firstNames.length];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const grade = grades[Math.floor(Math.random() * grades.length)];
      
      // Randomly assign teachers
      // For simplicity, we'll assign the same teacher for multiple periods sometimes
      const R1Id = teacherIds[Math.floor(Math.random() * teacherIds.length)];
      const R2Id = teacherIds[Math.floor(Math.random() * teacherIds.length)];
      const RRId = teacherIds[Math.floor(Math.random() * teacherIds.length)];
      const R4Id = teacherIds[Math.floor(Math.random() * teacherIds.length)];
      const R5Id = teacherIds[Math.floor(Math.random() * teacherIds.length)];
      
      students.push({
        id: 100000000 + i,
        first_name: firstName,
        last_name: lastName,
        grade,
        R1Id,
        R2Id,
        RRId,
        R4Id,
        R5Id
      });
    }
    
    await Student.bulkCreate(students);
    console.log('Sample students created');

    // Create some sample tutoring requests
    const allStudents = await Student.findAll();
    
    // Get today's date and format it for SQLite
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    
    // Create a few sample tutoring requests
    const requests = [];
    
    for (let i = 0; i < 5; i++) {
      const student = allStudents[Math.floor(Math.random() * allStudents.length)];
      const teacher = teachers[Math.floor(Math.random() * teachers.length)];
      
      requests.push({
        TeacherId: teacher.id,
        StudentId: student.id,
        date: formattedDate,
        lunchA: Math.random() > 0.5,
        lunchB: Math.random() > 0.5,
        lunchC: Math.random() > 0.5,
        lunchD: Math.random() > 0.5,
        status: 'active'
      });
    }
    
    await TutoringRequest.bulkCreate(requests);
    console.log('Sample tutoring requests created');

    console.log('Database initialization completed successfully');
    
    // Display information about what was created
    console.log('\nDatabase Summary:');
    console.log('----------------');
    console.log(`Teachers created: ${teachers.length}`);
    console.log(`Students created: ${students.length}`);
    console.log(`Tutoring requests created: ${requests.length}`);
    console.log('\nTeacher details:');
    teachers.forEach(teacher => {
      console.log(`- ${teacher.last_name} (${teacher.subject}, Lunch ${teacher.lunch})`);
    });
    
    // Close the database connection
    await sequelize.close()
    .then(()=>console.log("Database Closed"));
    
  } catch (error) {
    console.error('Database initialization failed:', error);
  }
}

// Run the initialization
initDatabase();
