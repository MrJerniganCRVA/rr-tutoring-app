const express = require('express');
const { Sequelize } = require('sequelize');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Set up Sequelize with SQLite
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite', // This will create a SQLite database file
  logging: false // Set to true if you want to see SQL queries in console
});

// Test database connection
sequelize.authenticate()
  .then(() => console.log('Database connected successfully'))
  .catch(err => console.error('Unable to connect to the database:', err));

// Sync database (create tables based on models)
sequelize.sync({ alter: true })
  .then(() => console.log('Database synced'))
  .catch(err => console.error('Error syncing database:', err));

// Define routes
app.use('/api/teachers', require('./routes/teachers'));
app.use('/api/students', require('./routes/students'));
app.use('/api/tutoring', require('./routes/tutoring'));

// Simple test route
app.get('/', (req, res) => {
  res.json({ msg: 'Welcome to the Tutoring Scheduler API' });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
