
const express = require('express');
const cors = require('cors');
const sequelize = require('./config/db');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());
// Define routes
app.use('/api/teachers', require('./routes/teachers'));
app.use('/api/students', require('./routes/students'));
app.use('/api/tutoring', require('./routes/tutoring'));

// Test database connection
sequelize.authenticate()
  .then(() => {
    console.log('Database connected successfully');
    sequelize.sync().then(()=>{
      app.listen(PORT, () => console.log(`Server running on port:${PORT}`));
      console.log("Listening");
    })
    .catch((err)=>{
      console.error("Unable to connect", err);
    });
  })
  .catch(err => console.error('Unable to connect to the database:', err));

// Simple test route
app.get('/', (req, res) => {
  res.json({ msg: 'Welcome to the Tutoring Scheduler API' });
});