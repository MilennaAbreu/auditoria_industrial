const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const ChecklistItem = sequelize.define('ChecklistItem', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  categoria: { type: DataTypes.STRING(100), allowNull: false },
  descricao: { type: DataTypes.TEXT, allowNull: false }
}, {
  tableName: 'checklist_item',
  timestamps: false
});

module.exports = ChecklistItem;
