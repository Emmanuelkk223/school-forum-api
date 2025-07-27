const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const prisma = require('./config/database');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const postRoutes = require('./routes/posts');
const categoryRoutes = require('./routes/categories');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test database connection
const testDatabaseConnection = async () => {
  try {
    await prisma.$connect();
    console.log('Connected to PostgreSQL database via Neon');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

testDatabaseConnection();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/categories', categoryRoutes);

// Basic route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to School Forum API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      posts: '/api/posts',
      categories: '/api/categories'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
