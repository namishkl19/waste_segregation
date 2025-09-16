const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { User, WasteBin, HouseLocation, Reward, Waste } = require('../models');
const { Op } = require('sequelize');

// Make sure the waste-levels endpoint returns proper data
router.get('/waste-levels', auth, async (req, res) => {
    try {
        console.log('Fetching waste levels for user:', req.user.id);
        
        // Find user's waste bin
        const wasteBin = await WasteBin.findOne({
            where: { userId: req.user.id },
            include: [{
                model: HouseLocation,
                attributes: ['address']
            }]
        });

        // Get recent waste history
        let wasteHistory = [];
        let binData = null;
        
        if (wasteBin) {
            wasteHistory = await Waste.findAll({
                where: { 
                    binId: wasteBin.id,
                    collectionDate: {
                        [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
                    }
                },
                order: [['collectionDate', 'DESC']]
            });
            
            binData = {
                organicLevel: wasteBin.organicLevel || 0,
                nonRecyclableLevel: wasteBin.nonRecyclableLevel || 0,
                hazardousLevel: wasteBin.hazardousLevel || 0,
                lastUpdated: wasteBin.lastUpdated || new Date(),
                plasticDetected: wasteBin.plasticDetected || false,
                houseAddress: wasteBin.HouseLocation ? wasteBin.HouseLocation.address : null
            };
        } else {
            console.log('No waste bin found for user:', req.user.id);
        }

        // Get user rewards
        const rewards = await Reward.findOne({
            where: { userId: req.user.id }
        });

        // Return all data needed for user dashboard
        res.json({
            binData: binData,
            wasteHistory: wasteHistory || [],
            rewards: rewards || {
                totalPoints: 0,
                organicPoints: 0,
                nonRecyclablePoints: 0,
                plasticPenalty: 0
            }
        });

    } catch (error) {
        console.error('Error in /waste-levels:', error);
        res.status(500).json({ 
            message: 'Error fetching waste levels',
            error: error.message 
        });
    }
});

module.exports = router;