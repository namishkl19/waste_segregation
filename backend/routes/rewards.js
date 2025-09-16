const express = require('express');
const router = express.Router();
const { WasteBin, Reward } = require('../models');
const verifyToken = require('../middleware/auth');

router.get('/points', verifyToken, async (req, res) => {
    try {
        // First get the waste bin data
        const wasteBin = await WasteBin.findOne({
            where: { userId: req.user.id }
        });

        if (!wasteBin) {
            return res.status(404).json({ message: 'No waste bin found' });
        }

        // Calculate points based on waste levels
        const points = {
            organic: 0,
            nonRecyclable: 0,
            plastic: 0,
            total: 0
        };

        // Calculate organic points
        if (wasteBin.organicLevel >= 90) points.organic = 15;
        else if (wasteBin.organicLevel >= 70) points.organic = 10;
        else if (wasteBin.organicLevel >= 50) points.organic = 5;

        // Calculate non-recyclable points
        if (wasteBin.nonRecyclableLevel >= 90) points.nonRecyclable = 8;
        else if (wasteBin.nonRecyclableLevel >= 70) points.nonRecyclable = 5;
        else if (wasteBin.nonRecyclableLevel >= 50) points.nonRecyclable = 2;

        // Calculate total
        points.total = points.organic + points.nonRecyclable + points.plastic;

        // Update or create rewards record
        let reward = await Reward.findOne({
            where: { userId: req.user.id }
        });

        if (reward) {
            await reward.update({
                organicPoints: points.organic,
                nonRecyclablePoints: points.nonRecyclable,
                plasticPenalty: points.plastic,
                totalPoints: points.total,
                lastCalculated: new Date()
            });
        } else {
            reward = await Reward.create({
                userId: req.user.id,
                organicPoints: points.organic,
                nonRecyclablePoints: points.nonRecyclable,
                plasticPenalty: points.plastic,
                totalPoints: points.total,
                lastCalculated: new Date()
            });
        }

        console.log('Points calculated:', points); // Debug log
        console.log('Reward record:', reward.toJSON()); // Debug log

        res.json({
            points,
            lastCalculated: reward.lastCalculated
        });
    } catch (error) {
        console.error('Reward calculation error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;