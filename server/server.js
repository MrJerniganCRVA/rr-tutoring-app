
const express = require('express');
const cors = require('cors');
const sequelize = require('./config/db');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const runMigration = process.env.RUN_MIGRATION === 'true';


app.use(express.json());
app.use(cors());
// Define routes
app.use('/api/teachers', require('./routes/teachers'));
app.use('/api/students', require('./routes/students'));
app.use('/api/tutoring', require('./routes/tutoring'));

if(runMigration){

  console.log('Starting migration');
  sequelize.sync({ force: true})
    .then(()=> {
      console.log('Migration Completed');
      process.exit(0);
    }).catch(e => {
      console.error('Migration failed', e);
      process.exit(1);
    });


} else{

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
}
// Simple test route
app.get('/', (req, res) => {
  res.json({ msg: 'Welcome to the RR Tutoring Scheduler API' });
});