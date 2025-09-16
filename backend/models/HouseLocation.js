const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

module.exports = (sequelize, DataTypes) => {
    const HouseLocation = sequelize.define('HouseLocation', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        houseId: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false
        },
        address: {
            type: DataTypes.STRING,
            allowNull: false
        },
        latitude: {
            type: DataTypes.FLOAT,
            allowNull: false
        },
        longitude: {
            type: DataTypes.FLOAT,
            allowNull: false
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Users',
                key: 'id'
            }
        }
    });

    HouseLocation.associate = function(models) {
        HouseLocation.belongsTo(models.User, {
            foreignKey: 'userId'
        });
        HouseLocation.hasOne(models.WasteBin, {
            foreignKey: 'houseId',
            sourceKey: 'houseId'
        });
    };

    return HouseLocation;
};