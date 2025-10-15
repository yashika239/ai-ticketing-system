# AI-Powered Ticket System

A comprehensive issue ticketing system built with Node.js, Express, React, and SQLite, featuring AI-powered ticket summarization and classification.

## Features

### Core Functionality
- **User Authentication**: Secure login/registration with JWT tokens
- **Ticket Management**: Create, read, update, delete tickets
- **User Roles**: Admin and regular user roles with appropriate permissions
- **Assignment System**: Assign tickets to users
- **Status Tracking**: Track ticket status (open, in progress, resolved)
- **Comments**: Add comments to tickets for collaboration
- **Search & Filtering**: Advanced search and filtering capabilities

### AI-Powered Features
- **Automatic Summarization**: AI generates concise summaries of ticket descriptions
- **Smart Classification**: Automatically categorizes tickets (bug, feature, query)
- **Priority Detection**: AI suggests priority levels based on content
- **Confidence Scoring**: Shows confidence levels for AI suggestions

### User Interface
- **Modern Design**: Clean, responsive Material-UI interface
- **Dashboard**: Overview of ticket statistics and recent activity
- **Real-time Updates**: Dynamic updates without page refresh
- **Mobile Friendly**: Responsive design works on all devices

## Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **SQLite** - Database
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Natural** - Natural language processing
- **Compromise** - Text analysis

### Frontend
- **React** - UI framework
- **Material-UI** - Component library
- **React Router** - Navigation
- **Axios** - HTTP client
- **Context API** - State management

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### 1. Clone the Repository
```bash
git clone <repository-url>
cd ticketsystem
```

### 2. Install Dependencies
```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

### 3. Environment Configuration
Create a `.env` file in the root directory:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_PATH=./server/database/tickets.db

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production-please

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

### 4. Initialize Database
The database will be automatically created when you first run the server. A default admin user will be created:
- **Username**: admin
- **Password**: admin123
- **Email**: admin@ticketsystem.com

### 5. Start the Application

#### Development Mode (Recommended)
```bash
# Start both backend and frontend concurrently
npm run dev
```

#### Manual Start
```bash
# Terminal 1: Start backend server
npm run server

# Terminal 2: Start frontend development server
npm run client
```

### 6. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/api/health

## Usage Guide

### Getting Started
1. Open http://localhost:3000 in your browser
2. Login with the default admin credentials:
   - Username: `admin`
   - Password: `admin123`
3. Explore the dashboard to see system overview
4. Create your first ticket using the "New Ticket" button

### Creating Tickets
1. Click "New Ticket" from the navigation or dashboard
2. Fill in the title and description
3. Use "AI Analysis & Suggestions" to get automatic categorization
4. Assign the ticket to a user (optional)
5. Submit the ticket

### Managing Tickets
- **View All Tickets**: Navigate to the Tickets page
- **Filter & Search**: Use the search bar and filters to find specific tickets
- **Update Status**: Click on a ticket to view details and update status
- **Add Comments**: Collaborate by adding comments to tickets
- **Assignment**: Assign/reassign tickets to different users

### User Management
- **Profile**: Update your profile information and change password
- **Roles**: Admin users can manage all tickets, regular users can manage their own

## API Documentation

### Authentication Endpoints
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - User login
- `POST /api/users/verify-token` - Verify JWT token
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

### Ticket Endpoints
- `GET /api/tickets` - Get all tickets (with filtering)
- `GET /api/tickets/:id` - Get single ticket
- `POST /api/tickets` - Create new ticket
- `PUT /api/tickets/:id` - Update ticket
- `DELETE /api/tickets/:id` - Delete ticket
- `POST /api/tickets/:id/comments` - Add comment to ticket

### AI Endpoints
- `POST /api/ai/analyze` - Analyze ticket for category, priority, and summary
- `POST /api/ai/summarize` - Generate summary for ticket
- `POST /api/ai/classify` - Classify ticket category and priority
- `GET /api/ai/categories` - Get available categories and priorities

### User Endpoints
- `GET /api/users` - Get all users (for assignment)

## Database Schema

### Users Table
- `id` - Primary key
- `username` - Unique username
- `email` - Unique email address
- `password_hash` - Hashed password
- `role` - User role (admin/user)
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

### Tickets Table
- `id` - Primary key
- `title` - Ticket title
- `description` - Detailed description
- `summary` - AI-generated summary
- `category` - Ticket category (bug/feature/query)
- `priority` - Priority level (high/medium/low)
- `status` - Current status (open/in_progress/resolved)
- `created_by` - User who created the ticket
- `assigned_to` - User assigned to the ticket
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp
- `resolved_at` - Resolution timestamp

### Comments Table
- `id` - Primary key
- `ticket_id` - Reference to ticket
- `user_id` - User who made the comment
- `content` - Comment content
- `created_at` - Creation timestamp

## AI Features Details

### Text Classification
The system uses keyword-based classification to categorize tickets:
- **Bug Reports**: Identifies error-related keywords
- **Feature Requests**: Detects enhancement and new feature requests
- **Queries**: Recognizes help and question patterns

### Priority Detection
AI analyzes content for urgency indicators:
- **High Priority**: Critical, urgent, emergency keywords
- **Medium Priority**: Important, needed, required keywords
- **Low Priority**: Minor, nice-to-have, eventual keywords

### Summarization
The system generates concise summaries by:
- Extracting key sentences from descriptions
- Identifying important keywords and phrases
- Creating readable summaries under 200 characters

## Deployment

### Production Build
```bash
# Build frontend for production
cd client
npm run build
cd ..

# Set environment to production
export NODE_ENV=production

# Start production server
npm start
```

### Environment Variables for Production
```env
NODE_ENV=production
PORT=5000
JWT_SECRET=your-very-secure-production-jwt-secret
DB_PATH=./server/database/tickets.db
CORS_ORIGIN=https://your-domain.com
```

## Security Considerations

- Change default admin password immediately
- Use strong JWT secrets in production
- Implement HTTPS in production
- Regular database backups
- Input validation and sanitization
- Rate limiting for API endpoints

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the API endpoints

## Changelog

### Version 1.0.0
- Initial release
- Core ticket management functionality
- AI-powered classification and summarization
- User authentication and authorization
- Modern React frontend with Material-UI
- SQLite database with automatic setup
- Comprehensive API documentation
