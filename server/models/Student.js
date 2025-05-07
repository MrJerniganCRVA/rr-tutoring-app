const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Teacher = require('./Teacher');

const Student = sequelize.define('Student', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  timestamps: true
});

// Define associations after the model is defined
Student.belongsTo(Teacher, { as: 'R1', foreignKey: 'R1Id' });
Student.belongsTo(Teacher, { as: 'R2', foreignKey: 'R2Id' });
Student.belongsTo(Teacher, { as: 'RR', foreignKey: 'RRId' });
Student.belongsTo(Teacher, { as: 'R4', foreignKey: 'R4Id' });
Student.belongsTo(Teacher, { as: 'R5', foreignKey: 'R5Id' });

module.exports = Student;
