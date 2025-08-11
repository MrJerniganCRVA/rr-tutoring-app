const { Sequelize } = require('sequelize');

// Debug logging
console.log('Environment check:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('DATABASE_URL value:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
if (process.env.DATABASE_URL) {
  console.log('DATABASE_URL starts with:', process.env.DATABASE_URL.substring(0, 15) + '...');
}

let sequelize;

if (process.env.DATABASE_URL) {
  console.log('Using PostgreSQL in production');
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgresql',
    dialectOptions: {
      ssl: { require: true, rejectUnauthorized: false }
    }
  });
} else {
  console.log('Using SQLite for local development');
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database.db'
  });
}

module.exports = sequelize;
