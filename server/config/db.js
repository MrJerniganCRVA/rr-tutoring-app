const { Sequelize } = require('sequelize');

let sequelize;

if (process.env.DATABASE_URL) {
  console.log('Using PostgreSQL in production');
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgresql',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: false
  });
} else {
  console.log('Using SQLite for local development');
  const sqlite3 = require('sqlite3'); 
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database.db',
    logging: false
  });
}

module.exports = sequelize;
