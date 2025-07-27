const prisma = require('../config/database');

class Category {
  // Create a new category
  static async create(categoryData) {
    // Trim and process data
    const processedData = {
      ...categoryData,
      name: categoryData.name?.trim(),
      description: categoryData.description?.trim()
    };

    const category = await prisma.category.create({
      data: processedData,
      include: {
        createdBy: true
      }
    });

    return this.toJSON(category);
  }

  // Find category by ID
  static async findById(id, includePostCount = false) {
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        createdBy: true,
        _count: includePostCount ? {
          posts: true
        } : undefined
      }
    });
    
    if (!category) return null;
    return this.toJSON(category, includePostCount);
  }

  // Find all categories
  static async find(filters = {}, options = {}) {
    const { limit, skip, sort, includePostCount = false } = options;
    
    const categories = await prisma.category.findMany({
      where: filters,
      take: limit,
      skip: skip,
      orderBy: sort ? Object.entries(sort).map(([key, value]) => ({ [key]: value === 1 ? 'asc' : 'desc' })) : undefined,
      include: {
        createdBy: true,
        _count: includePostCount ? {
          posts: true
        } : undefined
      }
    });

    return categories.map(category => this.toJSON(category, includePostCount));
  }

  // Update category
  static async findByIdAndUpdate(id, updateData) {
    // Process string fields
    if (updateData.name) updateData.name = updateData.name.trim();
    if (updateData.description) updateData.description = updateData.description.trim();

    const category = await prisma.category.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: true
      }
    });

    return this.toJSON(category);
  }

  // Delete category
  static async findByIdAndDelete(id) {
    const category = await prisma.category.delete({
      where: { id },
      include: {
        createdBy: true
      }
    });
    
    return this.toJSON(category);
  }

  // Find by name
  static async findByName(name) {
    const category = await prisma.category.findUnique({
      where: { name: name.trim() },
      include: {
        createdBy: true
      }
    });
    
    if (!category) return null;
    return this.toJSON(category);
  }

  // Get category count
  static async count(filters = {}) {
    return prisma.category.count({ where: filters });
  }

  // Transform category object for JSON response
  static toJSON(category, includePostCount = false) {
    if (!category) return null;
    
    const result = {
      ...category,
      createdBy: category.createdBy ? {
        id: category.createdBy.id,
        username: category.createdBy.username,
        firstName: category.createdBy.firstName,
        lastName: category.createdBy.lastName,
        fullName: `${category.createdBy.firstName} ${category.createdBy.lastName}`
      } : undefined
    };

    // Add post count if requested
    if (includePostCount && category._count) {
      result.postCount = category._count.posts;
      delete result._count;
    }

    return result;
  }
}

module.exports = Category;
