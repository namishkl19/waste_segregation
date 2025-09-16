const express = require('express');
const router = express.Router();
const { Sequelize } = require('sequelize');
const Waste = require('../models/Waste');
const { WasteBin } = require('../models');
const Reward = require('../models/Reward');
const verifyToken = require('../middleware/auth');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const { calculateBinFillLevel } = require('../utils/binCalculations');

// Debug middleware
router.use((req, res, next) => {
    console.log(`[Waste Route] ${req.method} ${req.path}`, { body: req.body });
    next();
});

// Get waste statistics
router.get('/stats', verifyToken, async (req, res) => {
    try {
        console.log('Getting stats for user:', req.user.id);
        const stats = await Waste.findAll({
            where: { userId: req.user.id },
            attributes: [
                'type',
                [Sequelize.fn('SUM', Sequelize.col('quantity')), 'total']
            ],
            group: ['type']
        });

        const formattedStats = {
            organic: 0,
            nonRecyclable: 0,
            hazardous: 0
        };

        stats.forEach(stat => {
            formattedStats[stat.type] = parseFloat(stat.getDataValue('total')) || 0;
        });

        res.json(formattedStats);
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Add waste entry
router.post('/add', verifyToken, async (req, res) => {
    try {
        console.log('Adding waste entry:', req.body);

        const { type, quantity, location } = req.body;

        // Input validation
        if (!type || !['organic', 'nonRecyclable', 'hazardous'].includes(type)) {
            return res.status(400).json({ message: 'Invalid waste type' });
        }

        if (!quantity || isNaN(quantity) || quantity <= 0) {
            return res.status(400).json({ message: 'Invalid quantity' });
        }

        if (!location || location.trim() === '') {
            return res.status(400).json({ message: 'Location is required' });
        }

        console.log('Validated inputs:', { type, quantity, location, userId: req.user.id });

        // Create waste entry
        const waste = await Waste.create({
            type,
            quantity: parseFloat(quantity),
            location: location.trim(),
            userId: req.user.id
        });

        console.log('Created waste entry:', waste.toJSON());

        res.status(201).json(waste);
    } catch (error) {
        console.error('Waste addition error:', error);

        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({ message: error.errors[0].message });
        }

        res.status(500).json({ message: 'Server error' });
    }
});

// Get waste levels
router.get('/levels', verifyToken, async (req, res) => {
    try {
        console.log('User requesting waste levels:', req.user);

        if (req.user.role === 'authority') {
            // For authority users, return all assigned waste bins
            const authority = await User.findByPk(req.user.id);
            const wasteBins = await WasteBin.findAll({
                where: {
                    houseId: authority.assignedHouses
                }
            });
            return res.json(wasteBins);
        }

        // For regular users, return their waste bin
        const wasteBin = await WasteBin.findOne({
            where: { userId: req.user.id }
        });

        if (!wasteBin) {
            return res.status(404).json({ message: 'No waste bin found' });
        }

        res.json(wasteBin);
    } catch (error) {
        console.error('Error fetching waste levels:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Image detection and processing results
router.post('/image-detection', verifyToken, upload.single('image'), async (req, res) => {
    try {
        const { binId, plasticDetected, confidence } = req.body;

        const wasteBin = await WasteBin.findOne({
            where: { 
                id: binId,
                userId: req.user.id 
            }
        });

        if (!wasteBin) {
            return res.status(404).json({ message: 'Waste bin not found' });
        }

        await wasteBin.update({
            plasticDetected: plasticDetected === 'true',
            plasticConfidence: parseFloat(confidence),
            lastImageProcessed: new Date()
        });

        // Recalculate rewards after plastic detection
        const points = calculatePoints(wasteBin);
        await Reward.update({
            plasticPenalty: points.plastic,
            totalPoints: points.total,
            lastCalculated: new Date()
        }, {
            where: { userId: req.user.id }
        });

        res.json({ 
            message: 'Image processing results saved',
            points: points
        });
    } catch (error) {
        console.error('Image processing update error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
