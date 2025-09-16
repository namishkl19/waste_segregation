const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
require('dotenv').config();

// Enhanced signup route with better error handling
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }
    
    // Log signup attempt
    console.log(`Signup attempt for: ${email} with role: ${role || 'user'}`);
    
    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      console.log(`User already exists: ${email}`);
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Create new user with detailed error handling
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Set default role to 'user' if not specified
      const userRole = role || 'user';
      
      // Create user with explicit values
      const user = await User.create({
        name: name,
        email: email,
        password: hashedPassword,
        role: userRole,
        assignedHouses: userRole === 'authority' ? [] : null
      });
      
      console.log(`User created successfully: ${email} (ID: ${user.id})`);
      
      // Generate token
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' } // Extend to 7 days for better testing
      );
      
      res.status(201).json({
        message: 'User created successfully',
        token,
        name: user.name,
        role: user.role
      });
    } catch (createError) {
      console.error('Error creating user:', createError);
      // Check if it's a validation error
      if (createError.name === 'SequelizeValidationError') {
        return res.status(400).json({ 
          message: 'Validation error', 
          errors: createError.errors.map(e => e.message) 
        });
      }
      throw createError; // Rethrow for general error handling
    }
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Error creating user', error: error.message });
  }
});

// Improved login route with detailed error handling
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log(`Login attempt for: ${email}`);
    
    // Find user by email
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      console.log(`User not found: ${email}`);
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    console.log(`Found user: { id: ${user.id}, email: ${user.email}, role: ${user.role} }`);
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log(`Password verification result: ${isPasswordValid}`);
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    // Generate JWT token with longer expiration
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' } // 7 days - much longer for testing
    );
    
    console.log(`Login successful for: ${email} (token generated)`);
    
    // Return user info and token
    res.json({
      message: 'Login successful',
      token,
      name: user.name,
      role: user.role
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error logging in' });
  }
});

module.exports = router;
