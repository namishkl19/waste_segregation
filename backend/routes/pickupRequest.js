const express = require('express');
const router = express.Router();
const db = require('../models');
const TrashPickupRequest = db.TrashPickupRequest;
const User = db.User;
const HouseLocation = db.HouseLocation;
const auth = require('../middleware/auth');

// User submits a new trash pick-up request
router.post('/', auth, async (req, res) => {
  try {
    const { address, description, binDetails } = req.body;
    const userId = req.user.id;
    if (!address) return res.status(400).json({ message: 'Address is required' });
    const request = await TrashPickupRequest.create({ userId, address, description, binDetails });
    res.status(201).json(request);
  } catch (err) {
    console.error('Error creating trash pick-up request:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Authority fetches all requests
router.get('/', auth, async (req, res) => {
  try {
    // Only allow authority users
    if (req.user.role !== 'authority') return res.status(403).json({ message: 'Forbidden' });
    // Get user IDs assigned to this authority
    const assignedUsers = await User.findAll({
      where: { authorityId: req.user.id },
      attributes: ['id']
    });
    const assignedUserIds = assignedUsers.map(u => u.id);
    const requests = await TrashPickupRequest.findAll({
      where: { userId: assignedUserIds },
      include: [
        { model: User, attributes: ['name', 'email', 'id'] },
        { model: HouseLocation, as: 'HouseLocation', attributes: ['address', 'latitude', 'longitude'], required: false }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(requests);
  } catch (err) {
    console.error('Error fetching trash pick-up requests:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


// Accept a pickup request
router.patch('/:id/accept', async (req, res) => {
    try {
        const request = await TrashPickupRequest.findByPk(req.params.id);
        if (!request) {
            return res.status(404).json({ error: 'Request not found' });
        }
        request.status = 'accepted';
        await request.save();
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
