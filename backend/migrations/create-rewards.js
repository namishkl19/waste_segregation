module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Rewards', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      organicPoints: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      nonRecyclablePoints: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      plasticPenalty: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      totalPoints: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      lastCalculated: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('Rewards');
  }
};