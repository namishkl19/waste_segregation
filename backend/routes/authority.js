const express = require('express');
const router = express.Router();
const { HouseLocation, WasteBin, Waste, User } = require('../models');
const auth = require('../middleware/auth');

// Get overview data for authority dashboard
router.get('/overview', auth, async (req, res) => {
    try {
        console.log('Authority overview requested by user:', req.user.id);
        
        // Verify user is an authority
        if (req.user.role !== 'authority') {
            return res.status(403).json({ message: 'Access denied. Authority role required.' });
        }
        
        // Get all houses/locations for users assigned to this authority
        // First, get user IDs assigned to this authority
        const assignedUsers = await User.findAll({
            where: { authorityId: req.user.id },
            attributes: ['id']
        });
        const assignedUserIds = assignedUsers.map(u => u.id);
        // Now get houses for those users
        const houses = await HouseLocation.findAll({
            where: { userId: assignedUserIds },
            include: [
                {
                    model: WasteBin,
                    attributes: ['id', 'organicLevel', 'nonRecyclableLevel', 'hazardousLevel', 'lastUpdated', 'plasticDetected']
                }
            ]
        });
        // Get rewards for assigned users
        const { Reward } = require('../models');
        const rewards = await Reward.findAll({
            where: { userId: assignedUserIds },
            attributes: ['userId', 'organicPoints', 'nonRecyclablePoints', 'plasticPenalty', 'totalPoints']
        });
        const rewardMap = {};
        rewards.forEach(r => {
            rewardMap[r.userId] = {
                organicPoints: r.organicPoints,
                nonRecyclablePoints: r.nonRecyclablePoints,
                plasticPenalty: r.plasticPenalty,
                totalPoints: r.totalPoints
            };
        });
        
        // Calculate statistics
        const totalHouses = houses.length;
        let criticalBins = 0;
        let totalOrganic = 0;
        let totalNonRecyclable = 0;
        let totalHazardous = 0;
        
        // Process house data for response
        const houseData = houses.map(house => {
            const binData = house.WasteBin || {};
            const organicLevel = binData.organicLevel || 0;
            const nonRecyclableLevel = binData.nonRecyclableLevel || 0;
            const hazardousLevel = binData.hazardousLevel || 0;
            // Calculate maximum level for this bin
            const maxLevel = Math.max(organicLevel, nonRecyclableLevel, hazardousLevel);
            // Check if this bin is critical (over 80%)
            if (maxLevel > 80) {
                criticalBins++;
            }
            // Accumulate totals for average calculation
            totalOrganic += organicLevel;
            totalNonRecyclable += nonRecyclableLevel;
            totalHazardous += hazardousLevel;
            // Create bin status label
            let binStatus = 'normal';
            if (maxLevel > 80) binStatus = 'critical';
            else if (maxLevel > 60) binStatus = 'warning';
            // Add reward info for this user
            const reward = rewardMap[house.userId] || null;
            return {
                houseId: house.id,
                address: house.address,
                latitude: house.latitude,
                longitude: house.longitude,
                binStatus: binStatus,
                maxLevel: maxLevel,
                lastUpdated: binData.lastUpdated || null,
                organicLevel: binData.organicLevel || 0,
                nonRecyclableLevel: binData.nonRecyclableLevel || 0,
                hazardousLevel: binData.hazardousLevel || 0,
                userId: house.userId,
                reward: reward
            };
        });
        
        // Get critical bins (bins with levels over 80%)
        const criticalBinsData = houseData
            .filter(house => house.maxLevel > 80)
            .sort((a, b) => b.maxLevel - a.maxLevel);
        
        // Calculate averages
        const avgOrganicLevel = Math.round(totalHouses > 0 ? totalOrganic / totalHouses : 0);
        const avgNonRecyclableLevel = Math.round(totalHouses > 0 ? totalNonRecyclable / totalHouses : 0);
        const avgHazardousLevel = Math.round(totalHouses > 0 ? totalHazardous / totalHouses : 0);
        
        // Calculate waste distribution
        const totalWaste = totalOrganic + totalNonRecyclable + totalHazardous;
        const wasteDistribution = {
            organic: Math.round(totalWaste > 0 ? (totalOrganic / totalWaste) * 100 : 0),
            nonRecyclable: Math.round(totalWaste > 0 ? (totalNonRecyclable / totalWaste) * 100 : 0),
            hazardous: Math.round(totalWaste > 0 ? (totalHazardous / totalWaste) * 100 : 0)
        };
        
        // Send response
        res.json({
            stats: {
                totalHouses,
                criticalBins,
                avgOrganicLevel,
                avgNonRecyclableLevel,
                avgHazardousLevel
            },
            houses: houseData,
            criticalBins: criticalBinsData,
            wasteDistribution
        });
    } catch (error) {
        console.error('Error in authority overview:', error);
        res.status(500).json({ message: 'Error fetching authority overview', error: error.message });
    }
});

// Modify the overview route to test without auth

// FOR TESTING ONLY - remove auth middleware temporarily
router.get('/overview-test', async (req, res) => {
    try {
        // Return simple test data
        res.json({
            message: "Authority API is working",
            stats: {
                totalHouses: 10,
                criticalBins: 2,
                avgOrganicLevel: 50,
                avgNonRecyclableLevel: 40,
                avgHazardousLevel: 20
            },
            criticalBins: [
                { houseId: 1, address: "123 Main St", maxLevel: 85 },
                { houseId: 2, address: "456 Elm St", maxLevel: 90 }
            ],
            wasteDistribution: {
                organic: 45,
                nonRecyclable: 35,
                hazardous: 20
            }
        });
    } catch (error) {
        console.error('Error in test endpoint:', error);
        res.status(500).json({ message: 'Error in test endpoint', error: error.message });
    }
});

module.exports = router;