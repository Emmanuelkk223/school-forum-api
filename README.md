# School Forum API

A comprehensive REST API for a school forum application built with Node.js, Express, and MongoDB.

## Features

- **User Authentication**: JWT-based authentication with role-based access control
- **User Management**: Support for students, teachers, and admins
- **Categories**: Organized discussion categories
- **Posts & Replies**: Full featured forum posts with replies
- **Likes System**: Like/unlike posts and replies
- **Moderation Tools**: Pin, lock, and delete posts (teacher/admin only)
- **Search & Filtering**: Search posts by title, content, or tags
- **Pagination**: Efficient pagination for all list endpoints

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Express Validator
- **Security**: Bcrypt for password hashing

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd school-forum-api
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory and add:
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/school_forum
JWT_SECRET=your_jwt_secret_key_here_change_in_production
JWT_EXPIRE=7d
```

4. Start MongoDB service on your system

5. Run the application:
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - User login

### Users
- `GET /api/users/profile` - Get current user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get user by ID
- `PATCH /api/users/:id/status` - Update user status (admin only)

### Categories
- `GET /api/categories` - Get all categories
- `GET /api/categories/:id` - Get category by ID
- `POST /api/categories` - Create category (teacher/admin only)
- `PUT /api/categories/:id` - Update category (teacher/admin only)
- `DELETE /api/categories/:id` - Delete category (teacher/admin only)

### Posts
- `GET /api/posts` - Get all posts with pagination
- `GET /api/posts/:id` - Get post by ID
- `POST /api/posts` - Create a new post
- `PUT /api/posts/:id` - Update post (author/teacher/admin only)
- `DELETE /api/posts/:id` - Delete post (author/teacher/admin only)
- `POST /api/posts/:id/replies` - Add reply to post
- `POST /api/posts/:id/like` - Like/unlike post
- `PATCH /api/posts/:id/pin` - Pin/unpin post (teacher/admin only)
- `PATCH /api/posts/:id/lock` - Lock/unlock post (teacher/admin only)

## User Roles

### Student
- Create and manage own posts
- Reply to posts
- Like posts and replies
- View all public content

### Teacher
- All student permissions
- Create and manage categories
- Pin and lock posts
- Moderate content

### Admin
- All teacher permissions
- Manage users
- Full system administration

## Request Examples

### Register a new user
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@school.edu",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe",
    "role": "student",
    "grade": "10th"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@school.edu",
    "password": "password123"
  }'
```

### Create a category (requires teacher/admin token)
```bash
curl -X POST http://localhost:3000/api/categories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Mathematics",
    "description": "Discussion about math topics",
    "color": "#ff6b6b",
    "icon": "fas fa-calculator"
  }'
```

### Create a post
```bash
curl -X POST http://localhost:3000/api/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Help with Algebra",
    "content": "I need help understanding quadratic equations...",
    "category": "CATEGORY_ID",
    "tags": ["algebra", "help", "math"]
  }'
```

### Get posts with filters
```bash
curl "http://localhost:3000/api/posts?page=1&limit=10&category=CATEGORY_ID&search=algebra"
```

## Response Format

All API responses follow this format:

### Success Response
```json
{
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "error": "Error message",
  "details": "Additional error details (optional)"
}
```

### Validation Error Response
```json
{
  "errors": [
    {
      "field": "email",
      "message": "Please include a valid email"
    }
  ]
}
```

## Database Schema

### User
- `username`: Unique username
- `email`: User email address
- `password`: Hashed password
- `firstName`, `lastName`: User's full name
- `role`: student/teacher/admin
- `grade`: Required for students
- `subject`: Required for teachers
- `bio`: Optional user biography
- `isActive`: Account status

### Category
- `name`: Category name
- `description`: Category description
- `color`: Display color
- `icon`: Icon class name
- `createdBy`: Reference to user who created it

### Post
- `title`: Post title
- `content`: Post content
- `author`: Reference to user
- `category`: Reference to category
- `tags`: Array of tags
- `replies`: Array of reply objects
- `likes`: Array of user references
- `views`: View count
- `isPinned`: Pin status
- `isLocked`: Lock status

## Development

### Project Structure
```
├── models/          # Database models
├── routes/          # API routes
├── middleware/      # Custom middleware
├── server.js        # Main application file
├── package.json     # Dependencies
└── README.md        # This file
```

### Adding New Features
1. Create/update models in `models/`
2. Add routes in `routes/`
3. Add middleware if needed in `middleware/`
4. Update documentation

## License

This project is licensed under the ISC License.
