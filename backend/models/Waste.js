const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

module.exports = (sequelize, DataTypes) => {
    const Waste = sequelize.define('Waste', {
        // These appear to be the actual fields based on the error
        type: {
            type: DataTypes.STRING,
            allowNull: false
        },
        amount: {
            type: DataTypes.FLOAT,
            allowNull: false
        },
        binId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        collectionDate: {
            type: DataTypes.DATE,
            allowNull: false
        }
    });

    Waste.associate = function(models) {
        Waste.belongsTo(models.WasteBin, {
            foreignKey: 'binId'
        });
    };

    return Waste;
};