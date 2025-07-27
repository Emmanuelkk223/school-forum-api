const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');

const router = express.Router();

// Register a new user
router.post('/register', [
  body('username').isLength({ min: 3 }).trim().escape(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, email, password, firstName, lastName, role, grade, subject } = req.body;

  try {
    // Check if user already exists
    let existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Check if username already exists
    existingUser = await User.findByUsername(username);
    if (existingUser) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    // Convert role to enum format
    const userRole = role ? role.toUpperCase() : 'STUDENT';

    const user = await User.create({
      username,
      email,
      password,
      firstName,
      lastName,
      role: userRole,
      grade,
      subject
    });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// User login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').exists()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });

    res.json({
      message: 'Login successful',
      token,
      user: {
        username: user.username,
        email: user.email,
        fullName: user.fullName
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

