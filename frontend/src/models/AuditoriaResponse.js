const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const Auditoria = require('./Auditoria');
const ChecklistItem = require('./ChecklistItem');

const AuditoriaResponse = sequelize.define('AuditoriaResponse', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  auditoria_id: {
    type: DataTypes.INTEGER, allowNull: false,
    references: { model: Auditoria, key: 'id' }
  },
  checklist_item_id: {
    type: DataTypes.INTEGER, allowNull: false,
    references: { model: ChecklistItem, key: 'id' }
  },
  rating: { type: DataTypes.ENUM('Excelente','Bom','Regular','Ruim'), allowNull: false },
  observacao: { type: DataTypes.TEXT }
}, {
  tableName: 'auditoria_response',
  timestamps: false
});

AuditoriaResponse.belongsTo(Auditoria, { foreignKey: 'auditoria_id' });
AuditoriaResponse.belongsTo(ChecklistItem, { foreignKey: 'checklist_item_id' });

module.exports = AuditoriaResponse;
