const { Sequelize } = require('sequelize');
const path = require('path');
let sequelize;


if(process.env.DATABASE_URL){
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgresql',
    dialectOptions: {
      ssl: process.env.NODE_ENV === 'production' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    }
  });
} else {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database.sqlite',
    logging:false
  });
}

module.exports = sequelize;
