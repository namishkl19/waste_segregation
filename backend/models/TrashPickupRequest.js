// TrashPickupRequest.js - Sequelize model for custom trash pick-up requests

module.exports = (sequelize, DataTypes) => {
  const TrashPickupRequest = sequelize.define('TrashPickupRequest', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    address: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'pending'
    },
    binDetails: {
      type: DataTypes.JSON,
      allowNull: true
    }
  });

  TrashPickupRequest.associate = (models) => {
    TrashPickupRequest.belongsTo(models.User, { foreignKey: 'userId' });
    TrashPickupRequest.belongsTo(models.HouseLocation, { foreignKey: 'userId', targetKey: 'userId', as: 'HouseLocation' });
  };

  return TrashPickupRequest;
};
