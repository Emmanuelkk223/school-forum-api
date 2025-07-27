const bcrypt = require('bcryptjs');
const prisma = require('../config/database');

class User {
  // Create a new user
  static async create(userData) {
    // Validate required fields based on role
    if (userData.role === 'STUDENT' && !userData.grade) {
      throw new Error('Grade is required for students');
    }
    if (userData.role === 'TEACHER' && !userData.subject) {
      throw new Error('Subject is required for teachers');
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(userData.password, salt);

    // Trim and process data
    const processedData = {
      ...userData,
      username: userData.username?.trim(),
      email: userData.email?.trim().toLowerCase(),
      password: hashedPassword,
      firstName: userData.firstName?.trim(),
      lastName: userData.lastName?.trim()
    };

    const user = await prisma.user.create({
      data: processedData
    });

    return this.toJSON(user);
  }

  // Find user by ID
  static async findById(id, includePassword = false) {
    const user = await prisma.user.findUnique({
      where: { id }
    });
    
    if (!user) return null;
    return includePassword ? user : this.toJSON(user);
  }

  // Find user by email
  static async findByEmail(email, includePassword = false) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });
    
    if (!user) return null;
    return includePassword ? user : this.toJSON(user);
  }

  // Find user by username
  static async findByUsername(username, includePassword = false) {
    const user = await prisma.user.findUnique({
      where: { username }
    });
    
    if (!user) return null;
    return includePassword ? user : this.toJSON(user);
  }

  // Update user
  static async findByIdAndUpdate(id, updateData) {
    // Hash password if being updated
    if (updateData.password) {
      const salt = await bcrypt.genSalt(12);
      updateData.password = await bcrypt.hash(updateData.password, salt);
    }

    // Process string fields
    if (updateData.username) updateData.username = updateData.username.trim();
    if (updateData.email) updateData.email = updateData.email.trim().toLowerCase();
    if (updateData.firstName) updateData.firstName = updateData.firstName.trim();
    if (updateData.lastName) updateData.lastName = updateData.lastName.trim();

    const user = await prisma.user.update({
      where: { id },
      data: updateData
    });

    return this.toJSON(user);
  }

  // Delete user
  static async findByIdAndDelete(id) {
    const user = await prisma.user.delete({
      where: { id }
    });
    
    return this.toJSON(user);
  }

  // Find all users with optional filters
  static async find(filters = {}, options = {}) {
    const { limit, skip, sort } = options;
    
    const users = await prisma.user.findMany({
      where: filters,
      take: limit,
      skip: skip,
      orderBy: sort ? Object.entries(sort).map(([key, value]) => ({ [key]: value === 1 ? 'asc' : 'desc' })) : undefined
    });

    return users.map(user => this.toJSON(user));
  }

  // Compare password
  static async comparePassword(candidatePassword, hashedPassword) {
    return bcrypt.compare(candidatePassword, hashedPassword);
  }

  // Update last login
  static async updateLastLogin(id) {
    await prisma.user.update({
      where: { id },
      data: { lastLogin: new Date() }
    });
  }

  // Transform user object for JSON response (remove password, add virtual fields)
  static toJSON(user) {
    if (!user) return null;
    
    const { password, ...userWithoutPassword } = user;
    return {
      ...userWithoutPassword,
      fullName: `${user.firstName} ${user.lastName}`
    };
  }

  // Get user count
  static async count(filters = {}) {
    return prisma.user.count({ where: filters });
  }
}

module.exports = User;
