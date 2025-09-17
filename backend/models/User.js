const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'user',
      validate: {
        isIn: [['user', 'authority']]
      }
    },
    assignedHouses: {
      type: DataTypes.JSON,
      allowNull: true
    },
    authorityId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      }
    }
  });

  User.associate = function(models) {
    User.hasMany(models.WasteBin, {
      foreignKey: 'userId',
      as: 'wasteBins'
    });
    User.hasOne(models.Reward, {
      foreignKey: 'userId',
      as: 'reward'
    });
  };

  return User;
};