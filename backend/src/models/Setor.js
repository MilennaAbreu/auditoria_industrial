const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Setor = sequelize.define('Setor', {
  id:   { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  nome: { type: DataTypes.STRING(100), allowNull: false, unique: true }
}, {
  tableName: 'setor',
  timestamps: false
});

module.exports = Setor;
