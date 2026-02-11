const express = require('express');
const cors = require('cors');
const session = require('express-session');
const sequelize = require('./config/db');
const passport = require('passport');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const runMigration = process.env.RUN_MIGRATION === 'true';


app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 7*24*60*60*1000,
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: process.env.NODE_ENV ==='production' ? 'none': 'lax'
    }
  })
);

//passport init
app.use(passport.initialize());
app.use(passport.session());

// load passport
require('./config/passport')(passport);

// Simple test route
app.get('/', (req, res) => {
  res.json({ msg: 'Welcome to the RR Tutoring Scheduler API' });
});
//Auth Routes
app.use('/auth', require('./routes/auth'));


// Define routes
app.use('/api/analytics', require('./routes/analytics'));
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
