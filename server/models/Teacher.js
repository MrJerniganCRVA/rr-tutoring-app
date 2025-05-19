const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Teacher = sequelize.define('Teacher', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: false
  },lunch:{
    type:DataTypes.STRING,
    allowNull:true,
    validate: {
      isIn: [['A','B','C','D']]
    }
  }
});

module.exports = Teacher;
