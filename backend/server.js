require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./models');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const authorityRoutes = require('./routes/authority');
const rewardsRoutes = require('./routes/rewards');
const wasteRoutes = require('./routes/waste');
const pickupRequestRoutes = require('./routes/pickupRequest');
app.use('/api/pickup-requests', pickupRequestRoutes);

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/authority', authorityRoutes);
app.use('/api/rewards', rewardsRoutes);
app.use('/api/waste', wasteRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Global error handler:', err);
    res.status(500).json({
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
});

const startServer = async () => {
    try {
        // Test database connection
        await db.sequelize.authenticate();
        console.log('Database connection established successfully.');

        // Sync database
        await db.sequelize.sync();
        console.log('Database synchronized successfully');

        // Start server with error handling
        const server = app.listen(port, () => {
            console.log(`Server running successfully on port ${port}`);
        });

        server.on('error', (error) => {
            if (error.code === 'EADDRINUSE') {
                console.error(`Port ${port} is already in use.`);
                process.exit(1);
            } else {
                console.error('Server error:', error);
                process.exit(1);
            }
        });
    } catch (error) {
        console.error('Server startup failed:', error);
        process.exit(1);
    }
};

startServer();
