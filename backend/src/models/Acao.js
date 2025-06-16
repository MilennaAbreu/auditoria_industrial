const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const Auditoria = require('./Auditoria');
const AuditoriaResponse = require('./AuditoriaResponse');

const Acao = sequelize.define('Acao', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  auditoria_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: Auditoria, key: 'id' } },
  response_id:  { type: DataTypes.INTEGER, references: { model: AuditoriaResponse, key: 'id' } },
  tipo:         { type: DataTypes.ENUM('Corretiva','Preventiva'), allowNull: false },
  descricao:    { type: DataTypes.TEXT, allowNull: false },
  prazo_correcao:{ type: DataTypes.DATEONLY, allowNull: false },
  responsavel:  { type: DataTypes.STRING(100) },
  solucionado:  { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  data_solucao: { type: DataTypes.DATEONLY }
}, {
  tableName: 'acao',
  timestamps: false
});

Acao.belongsTo(Auditoria, { foreignKey: 'auditoria_id' });
Acao.belongsTo(AuditoriaResponse, { foreignKey: 'response_id' });

module.exports = Acao;
