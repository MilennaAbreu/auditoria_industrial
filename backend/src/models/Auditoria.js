// src/models/Auditoria.js

const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const Setor = require('./Setor');

const Auditoria = sequelize.define('Auditoria', {
  id:               { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  nome_gestor:      { type: DataTypes.STRING(100), allowNull: false },
  setor_id:         { type: DataTypes.INTEGER, allowNull: false, references: { model: Setor, key: 'id' } },
  data_auditoria:   { type: DataTypes.DATEONLY,  allowNull: false },
  criado_em:        { type: DataTypes.DATE,      allowNull: false, defaultValue: DataTypes.NOW },
  nota:             { type: DataTypes.DOUBLE,    allowNull: true },
  observacoes_gerais:{ type: DataTypes.TEXT,     allowNull: true }
}, {
  tableName: 'auditoria',
  timestamps: false
});

Auditoria.belongsTo(Setor, { foreignKey: 'setor_id' });

module.exports = Auditoria;
