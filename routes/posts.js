const express = require('express');
const { body, validationResult } = require('express-validator');
const Post = require('../models/Post');
const Category = require('../models/Category');
const { authenticateToken, requireTeacherOrAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all posts with pagination and filtering
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      category, 
      author, 
      search, 
      sortBy = 'lastActivity', 
      sortOrder = 'desc' 
    } = req.query;

    const query = { isActive: true };
    
    if (category) query.category = category;
    if (author) query.author = author;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const posts = await Post.find(query)
      .populate('author', 'username fullName role')
      .populate('category', 'name color')
      .populate('replies.author', 'username fullName')
      .select('-replies.likes')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort(sortOptions);

    const total = await Post.countDocuments(query);

    res.json({
      posts,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get post by ID
router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'username fullName role avatar')
      .populate('category', 'name color')
      .populate('replies.author', 'username fullName role avatar')
      .populate('likes', 'username fullName');

    if (!post || !post.isActive) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Increment view count
    post.views += 1;
    await post.save();

    res.json({ post });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a new post
router.post('/', authenticateToken, [
  body('title').trim().isLength({ min: 5, max: 200 }).escape(),
  body('content').trim().isLength({ min: 10, max: 5000 }),
  body('category').isMongoId(),
  body('tags').optional().isArray()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { title, content, category, tags } = req.body;

    // Verify category exists
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(400).json({ error: 'Invalid category' });
    }

    const post = new Post({
      title,
      content,
      author: req.user._id,
      category,
      tags: tags || []
    });

    await post.save();
    await post.populate('author', 'username fullName role');
    await post.populate('category', 'name color');

    res.status(201).json({
      message: 'Post created successfully',
      post
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update post
router.put('/:id', authenticateToken, [
  body('title').optional().trim().isLength({ min: 5, max: 200 }).escape(),
  body('content').optional().trim().isLength({ min: 10, max: 5000 }),
  body('tags').optional().isArray()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Check if user is author or has admin/teacher privileges
    if (post.author.toString() !== req.user._id.toString() && 
        !['admin', 'teacher'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Not authorized to edit this post' });
    }

    const { title, content, tags } = req.body;
    const updateData = {};
    
    if (title) updateData.title = title;
    if (content) updateData.content = content;
    if (tags) updateData.tags = tags;
    updateData.isEdited = true;
    updateData.editedAt = new Date();

    const updatedPost = await Post.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('author', 'username fullName role')
     .populate('category', 'name color');

    res.json({
      message: 'Post updated successfully',
      post: updatedPost
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete post
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Check if user is author or has admin/teacher privileges
    if (post.author.toString() !== req.user._id.toString() && 
        !['admin', 'teacher'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Not authorized to delete this post' });
    }

    // Soft delete
    await Post.findByIdAndUpdate(req.params.id, { isActive: false });

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Add reply to post
router.post('/:id/replies', authenticateToken, [
  body('content').trim().isLength({ min: 1, max: 2000 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const post = await Post.findById(req.params.id);
    if (!post || !post.isActive) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.isLocked) {
      return res.status(403).json({ error: 'Post is locked' });
    }

    const reply = {
      content: req.body.content,
      author: req.user._id
    };

    post.replies.push(reply);
    await post.save();
    await post.populate('replies.author', 'username fullName role');

    const newReply = post.replies[post.replies.length - 1];

    res.status(201).json({
      message: 'Reply added successfully',
      reply: newReply
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Like/unlike post
router.post('/:id/like', authenticateToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post || !post.isActive) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const userId = req.user._id;
    const isLiked = post.likes.includes(userId);

    if (isLiked) {
      post.likes.pull(userId);
    } else {
      post.likes.push(userId);
    }

    await post.save();

    res.json({
      message: isLiked ? 'Post unliked' : 'Post liked',
      likeCount: post.likes.length,
      isLiked: !isLiked
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Pin/unpin post (teacher/admin only)
router.patch('/:id/pin', authenticateToken, requireTeacherOrAdmin, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    post.isPinned = !post.isPinned;
    await post.save();

    res.json({
      message: `Post ${post.isPinned ? 'pinned' : 'unpinned'} successfully`,
      isPinned: post.isPinned
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Lock/unlock post (teacher/admin only)
router.patch('/:id/lock', authenticateToken, requireTeacherOrAdmin, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    post.isLocked = !post.isLocked;
    await post.save();

    res.json({
      message: `Post ${post.isLocked ? 'locked' : 'unlocked'} successfully`,
      isLocked: post.isLocked
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
