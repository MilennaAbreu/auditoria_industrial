// src/models/AcaoCorretiva.js
const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const Auditoria = require('./Auditoria');

const AcaoCorretiva = sequelize.define('AcaoCorretiva', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    auditoria_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: Auditoria, key: 'id' }
    },
    descricao: {
        type: DataTypes.TEXT,
        allowNull: false
    }
}, {
    tableName: 'acao_corretiva',
    timestamps: false
});

AcaoCorretiva.belongsTo(Auditoria, { foreignKey: 'auditoria_id' });

module.exports = AcaoCorretiva;
