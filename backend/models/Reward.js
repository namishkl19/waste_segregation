const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

module.exports = (sequelize, DataTypes) => {
    const Reward = sequelize.define('Reward', {
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true
        },
        organicPoints: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        nonRecyclablePoints: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        plasticPenalty: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        totalPoints: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        lastCalculated: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    });

    Reward.associate = function(models) {
        Reward.belongsTo(models.User, {
            foreignKey: 'userId',
            as: 'user'
        });
    };

    return Reward;
};