const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const database = require('../config/database');

// Initialize database connection
database.connect().catch(console.error);

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// POST /api/users/register - Register new user
router.post('/register', async (req, res) => {
  try {
    const db = database.getDatabase();
    const { username, email, password, role = 'user' } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ 
        error: 'Username, email, and password are required' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'Password must be at least 6 characters long' 
      });
    }

    // Check if user already exists
    const existingUser = await new Promise((resolve, reject) => {
      db.get(
        'SELECT id FROM users WHERE username = ? OR email = ?',
        [username, email],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (existingUser) {
      return res.status(409).json({ 
        error: 'Username or email already exists' 
      });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert new user
    const query = `
      INSERT INTO users (username, email, password_hash, role)
      VALUES (?, ?, ?, ?)
    `;

    db.run(query, [username, email, passwordHash, role], function(err) {
      if (err) {
        console.error('Error creating user:', err);
        return res.status(500).json({ error: 'Failed to create user' });
      }

      // Generate JWT token
      const token = jwt.sign(
        { 
          id: this.lastID, 
          username, 
          email, 
          role 
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(201).json({
        message: 'User created successfully',
        user: {
          id: this.lastID,
          username,
          email,
          role,
          created_at: new Date().toISOString()
        },
        token
      });
    });
  } catch (error) {
    console.error('Error in user registration:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/users/login - User login
router.post('/login', async (req, res) => {
  try {
    const db = database.getDatabase();
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ 
        error: 'Username and password are required' 
      });
    }

    // Find user by username or email
    const user = await new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM users WHERE username = ? OR email = ?',
        [username, username],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        email: user.email, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        created_at: user.created_at
      },
      token
    });
  } catch (error) {
    console.error('Error in user login:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/users/profile - Get current user profile
router.get('/profile', authenticateToken, (req, res) => {
  try {
    const db = database.getDatabase();
    
    db.get(
      'SELECT id, username, email, role, created_at, updated_at FROM users WHERE id = ?',
      [req.user.id],
      (err, user) => {
        if (err) {
          console.error('Error fetching user profile:', err);
          return res.status(500).json({ error: 'Failed to fetch profile' });
        }

        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
      }
    );
  } catch (error) {
    console.error('Error in GET /profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/users/profile - Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const db = database.getDatabase();
    const { username, email, currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Build dynamic update query
    const updates = [];
    const params = [];

    if (username) {
      // Check if username is already taken by another user
      const existingUser = await new Promise((resolve, reject) => {
        db.get(
          'SELECT id FROM users WHERE username = ? AND id != ?',
          [username, userId],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });

      if (existingUser) {
        return res.status(409).json({ error: 'Username already taken' });
      }

      updates.push('username = ?');
      params.push(username);
    }

    if (email) {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }

      // Check if email is already taken by another user
      const existingUser = await new Promise((resolve, reject) => {
        db.get(
          'SELECT id FROM users WHERE email = ? AND id != ?',
          [email, userId],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });

      if (existingUser) {
        return res.status(409).json({ error: 'Email already taken' });
      }

      updates.push('email = ?');
      params.push(email);
    }

    // Handle password change
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ 
          error: 'Current password required to change password' 
        });
      }

      // Verify current password
      const user = await new Promise((resolve, reject) => {
        db.get(
          'SELECT password_hash FROM users WHERE id = ?',
          [userId],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });

      const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }

      // Validate new password
      if (newPassword.length < 6) {
        return res.status(400).json({ 
          error: 'New password must be at least 6 characters long' 
        });
      }

      // Hash new password
      const saltRounds = 10;
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);
      
      updates.push('password_hash = ?');
      params.push(newPasswordHash);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(userId);

    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;

    db.run(query, params, function(err) {
      if (err) {
        console.error('Error updating user profile:', err);
        return res.status(500).json({ error: 'Failed to update profile' });
      }

      // Fetch updated user data
      db.get(
        'SELECT id, username, email, role, created_at, updated_at FROM users WHERE id = ?',
        [userId],
        (err, updatedUser) => {
          if (err) {
            console.error('Error fetching updated user:', err);
            return res.status(500).json({ error: 'Profile updated but failed to fetch details' });
          }

          res.json({
            message: 'Profile updated successfully',
            user: updatedUser
          });
        }
      );
    });
  } catch (error) {
    console.error('Error in PUT /profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/users - Get all users (admin only or for assignment purposes)
router.get('/', authenticateToken, (req, res) => {
  try {
    const db = database.getDatabase();
    
    const query = `
      SELECT 
        id, 
        username, 
        email, 
        role, 
        created_at,
        (SELECT COUNT(*) FROM tickets WHERE created_by = users.id) as tickets_created,
        (SELECT COUNT(*) FROM tickets WHERE assigned_to = users.id) as tickets_assigned
      FROM users 
      ORDER BY username ASC
    `;

    db.all(query, [], (err, users) => {
      if (err) {
        console.error('Error fetching users:', err);
        return res.status(500).json({ error: 'Failed to fetch users' });
      }

      res.json(users);
    });
  } catch (error) {
    console.error('Error in GET /users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/users/verify-token - Verify JWT token
router.post('/verify-token', authenticateToken, (req, res) => {
  res.json({
    valid: true,
    user: {
      id: req.user.id,
      username: req.user.username,
      email: req.user.email,
      role: req.user.role
    }
  });
});

module.exports = router;
