const express = require('express');
const { body, validationResult } = require('express-validator');
const Category = require('../models/Category');
const { authenticateToken, requireTeacherOrAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all categories
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .populate('createdBy', 'username fullName')
      .populate('postCount')
      .sort({ createdAt: -1 });

    res.json({ categories });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get category by ID
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
      .populate('createdBy', 'username fullName')
      .populate('postCount');

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ category });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a new category (teacher/admin only)
router.post('/', authenticateToken, requireTeacherOrAdmin, [
  body('name').trim().isLength({ min: 1, max: 50 }).escape(),
  body('description').trim().isLength({ min: 1, max: 200 }).escape(),
  body('color').optional().matches(/^#[0-9A-F]{6}$/i),
  body('icon').optional().trim()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, description, color, icon } = req.body;

    // Check if category already exists
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return res.status(400).json({ error: 'Category already exists' });
    }

    const category = new Category({
      name,
      description,
      color,
      icon,
      createdBy: req.user._id
    });

    await category.save();
    await category.populate('createdBy', 'username fullName');

    res.status(201).json({
      message: 'Category created successfully',
      category
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update category (teacher/admin only)
router.put('/:id', authenticateToken, requireTeacherOrAdmin, [
  body('name').optional().trim().isLength({ min: 1, max: 50 }).escape(),
  body('description').optional().trim().isLength({ min: 1, max: 200 }).escape(),
  body('color').optional().matches(/^#[0-9A-F]{6}$/i),
  body('icon').optional().trim()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, description, color, icon } = req.body;

    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Check if new name already exists (if name is being changed)
    if (name && name !== category.name) {
      const existingCategory = await Category.findOne({ name });
      if (existingCategory) {
        return res.status(400).json({ error: 'Category name already exists' });
      }
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.id,
      { name, description, color, icon },
      { new: true, runValidators: true }
    ).populate('createdBy', 'username fullName');

    res.json({
      message: 'Category updated successfully',
      category: updatedCategory
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete category (teacher/admin only)
router.delete('/:id', authenticateToken, requireTeacherOrAdmin, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Soft delete by setting isActive to false
    await Category.findByIdAndUpdate(req.params.id, { isActive: false });

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
