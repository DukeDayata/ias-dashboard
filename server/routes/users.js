const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { logAction } = require('../utils/logger');

// Get all users
router.get('/', async (req, res) => {
  try {
    // Exclude password from the query
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error fetching users' });
  }
});

// Create a new user
router.post('/', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const newUser = new User({ name, email, password, role });
    const saved = await newUser.save();
    
    // Don't return password
    const userResponse = {
      _id: saved._id,
      name: saved.name,
      email: saved.email,
      role: saved.role,
      createdAt: saved.createdAt
    };
    
    await logAction(req.user, 'CREATE', 'USER', saved._id, { email: saved.email, role: saved.role });
    
    res.status(201).json(userResponse);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error creating user' });
  }
});

// Update an existing user
router.put('/:id', async (req, res) => {
  try {
    const { name, email, role, password } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.name = name || user.name;
    user.email = email || user.email;
    user.role = role || user.role;
    
    if (password) {
      user.password = password;
    }

    const updated = await user.save();
    
    const userResponse = {
      _id: updated._id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      createdAt: updated.createdAt
    };

    await logAction(req.user, 'UPDATE', 'USER', updated._id, { email: updated.email, role: updated.role });

    res.json(userResponse);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error updating user' });
  }
});

// Delete a user
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'User not found' });
    
    await logAction(req.user, 'DELETE', 'USER', deleted._id, { email: deleted.email });
    
    res.json({ message: 'User deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error deleting user' });
  }
});

module.exports = router;
