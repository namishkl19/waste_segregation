require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USER || 'waste_user',
    password: process.env.DB_PASSWORD || 'waste_password123',
    database: process.env.DB_NAME || 'waste_dashboard',
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql'
  }
};