const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Teacher = require('./Teacher');

const Student = sequelize.define('Student', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false
  },
  first_name: {
    type:DataTypes.STRING,
    allowNull: false
  },
  last_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type:DataTypes.STRING,
    allowNull:false,
    validate: {
      isEmail:true
    }
  }
});

// Define associations after the model is defined
Student.belongsTo(Teacher, { as: 'R1', foreignKey: 'R1Id' });
Student.belongsTo(Teacher, { as: 'R2', foreignKey: 'R2Id' });
Student.belongsTo(Teacher, { as: 'RR', foreignKey: 'RRId' });
Student.belongsTo(Teacher, { as: 'R4', foreignKey: 'R4Id' });
Student.belongsTo(Teacher, { as: 'R5', foreignKey: 'R5Id' });
Student.belongsTo(Teacher, { as: 'R6',  foreignKey: 'R6Id' });
Student.belongsTo(Teacher, { as: 'R7',  foreignKey: 'R7Id' });
Student.belongsTo(Teacher, { as: 'R8',  foreignKey: 'R8Id' });
Student.belongsTo(Teacher, { as: 'R9',  foreignKey: 'R9Id' });
Student.belongsTo(Teacher, { as: 'R10', foreignKey: 'R10Id' });

module.exports = Student;
