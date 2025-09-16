const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
    process.env.DB_NAME || 'waste_dashboard',
    process.env.DB_USER || 'root',
    process.env.DB_PASS || '',
    {
        host: process.env.DB_HOST || 'localhost',
        dialect: 'mysql',
        logging: false,
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    }
);

module.exports = {
  database: 'waste_dashboard',
  username: 'root',         // your MySQL username
  password: '',             // your MySQL password
  host: 'localhost',
  dialect: 'mysql',
  logging: console.log, // Temporarily enable logging for debugging
  pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
  }
};