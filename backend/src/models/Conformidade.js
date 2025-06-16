// src/models/Conformidade.js
const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const Auditoria = require('./Auditoria');
const Setor = require('./Setor');

const Conformidade = sequelize.define('Conformidade', {
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
    setor_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: Setor, key: 'id' }
    },
    descricao: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    prazo_correcao: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    resolvido: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    }
}, {
    tableName: 'conformidade',
    timestamps: false
});

Conformidade.belongsTo(Auditoria, { foreignKey: 'auditoria_id' });
Conformidade.belongsTo(Setor, { foreignKey: 'setor_id' });

module.exports = Conformidade;
