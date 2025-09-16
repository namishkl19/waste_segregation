const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

module.exports = (sequelize, DataTypes) => {
    const WasteBin = sequelize.define('WasteBin', {
        houseId: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        organicLevel: {
            type: DataTypes.FLOAT,
            defaultValue: 0
        },
        nonRecyclableLevel: {
            type: DataTypes.FLOAT,
            defaultValue: 0
        },
        hazardousLevel: {
            type: DataTypes.FLOAT,
            defaultValue: 0
        },
        lastUpdated: {
            type: DataTypes.DATE
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        plasticDetected: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        plasticConfidence: {
            type: DataTypes.FLOAT,
            defaultValue: 0
        },
        lastImageProcessed: {
            type: DataTypes.DATE
        }
    });

    WasteBin.associate = function(models) {
        WasteBin.belongsTo(models.HouseLocation, {
            foreignKey: 'houseId',
            targetKey: 'houseId'
        });
        WasteBin.belongsTo(models.User, {
            foreignKey: 'userId'
        });
    };

    return WasteBin;
};