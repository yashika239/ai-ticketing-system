const express = require('express');
const router = express.Router();
const database = require('../config/database');

// Initialize database connection
database.connect().catch(console.error);

// GET /api/tickets - Get all tickets with filtering and pagination
router.get('/', async (req, res) => {
  try {
    const db = database.getDatabase();
    const { 
      page = 1, 
      limit = 10, 
      status, 
      category, 
      priority, 
      assigned_to, 
      created_by,
      search 
    } = req.query;

    const offset = (page - 1) * limit;
    let whereClause = '';
    let params = [];

    // Build WHERE clause based on filters
    const conditions = [];
    
    if (status) {
      conditions.push('t.status = ?');
      params.push(status);
    }
    
    if (category) {
      conditions.push('t.category = ?');
      params.push(category);
    }
    
    if (priority) {
      conditions.push('t.priority = ?');
      params.push(priority);
    }
    
    if (assigned_to) {
      conditions.push('t.assigned_to = ?');
      params.push(assigned_to);
    }
    
    if (created_by) {
      conditions.push('t.created_by = ?');
      params.push(created_by);
    }
    
    if (search) {
      conditions.push('(t.title LIKE ? OR t.description LIKE ? OR t.summary LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (conditions.length > 0) {
      whereClause = 'WHERE ' + conditions.join(' AND ');
    }

    const query = `
      SELECT 
        t.*,
        creator.username as created_by_username,
        assignee.username as assigned_to_username,
        COUNT(c.id) as comment_count
      FROM tickets t
      LEFT JOIN users creator ON t.created_by = creator.id
      LEFT JOIN users assignee ON t.assigned_to = assignee.id
      LEFT JOIN comments c ON t.id = c.ticket_id
      ${whereClause}
      GROUP BY t.id
      ORDER BY t.created_at DESC
      LIMIT ? OFFSET ?
    `;

    params.push(parseInt(limit), offset);

    db.all(query, params, (err, tickets) => {
      if (err) {
        console.error('Error fetching tickets:', err);
        return res.status(500).json({ error: 'Failed to fetch tickets' });
      }

      // Get total count for pagination
      const countQuery = `
        SELECT COUNT(DISTINCT t.id) as total
        FROM tickets t
        LEFT JOIN users creator ON t.created_by = creator.id
        LEFT JOIN users assignee ON t.assigned_to = assignee.id
        ${whereClause}
      `;

      const countParams = params.slice(0, -2); // Remove limit and offset

      db.get(countQuery, countParams, (err, countResult) => {
        if (err) {
          console.error('Error counting tickets:', err);
          return res.status(500).json({ error: 'Failed to count tickets' });
        }

        res.json({
          tickets,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: countResult.total,
            pages: Math.ceil(countResult.total / limit)
          }
        });
      });
    });
  } catch (error) {
    console.error('Error in GET /tickets:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/tickets/:id - Get single ticket with comments
router.get('/:id', (req, res) => {
  try {
    const db = database.getDatabase();
    const ticketId = req.params.id;

    const ticketQuery = `
      SELECT 
        t.*,
        creator.username as created_by_username,
        creator.email as created_by_email,
        assignee.username as assigned_to_username,
        assignee.email as assigned_to_email
      FROM tickets t
      LEFT JOIN users creator ON t.created_by = creator.id
      LEFT JOIN users assignee ON t.assigned_to = assignee.id
      WHERE t.id = ?
    `;

    db.get(ticketQuery, [ticketId], (err, ticket) => {
      if (err) {
        console.error('Error fetching ticket:', err);
        return res.status(500).json({ error: 'Failed to fetch ticket' });
      }

      if (!ticket) {
        return res.status(404).json({ error: 'Ticket not found' });
      }

      // Get comments for this ticket
      const commentsQuery = `
        SELECT 
          c.*,
          u.username,
          u.email
        FROM comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.ticket_id = ?
        ORDER BY c.created_at ASC
      `;

      db.all(commentsQuery, [ticketId], (err, comments) => {
        if (err) {
          console.error('Error fetching comments:', err);
          return res.status(500).json({ error: 'Failed to fetch comments' });
        }

        res.json({
          ...ticket,
          comments
        });
      });
    });
  } catch (error) {
    console.error('Error in GET /tickets/:id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/tickets - Create new ticket
router.post('/', (req, res) => {
  try {
    const db = database.getDatabase();
    const {
      title,
      description,
      category,
      priority = 'medium',
      created_by,
      assigned_to
    } = req.body;

    if (!title || !description || !created_by) {
      return res.status(400).json({ 
        error: 'Title, description, and created_by are required' 
      });
    }

    const query = `
      INSERT INTO tickets (title, description, category, priority, created_by, assigned_to)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.run(query, [title, description, category, priority, created_by, assigned_to], function(err) {
      if (err) {
        console.error('Error creating ticket:', err);
        return res.status(500).json({ error: 'Failed to create ticket' });
      }

      // Fetch the created ticket with user details
      const fetchQuery = `
        SELECT 
          t.*,
          creator.username as created_by_username,
          assignee.username as assigned_to_username
        FROM tickets t
        LEFT JOIN users creator ON t.created_by = creator.id
        LEFT JOIN users assignee ON t.assigned_to = assignee.id
        WHERE t.id = ?
      `;

      db.get(fetchQuery, [this.lastID], (err, ticket) => {
        if (err) {
          console.error('Error fetching created ticket:', err);
          return res.status(500).json({ error: 'Ticket created but failed to fetch details' });
        }

        res.status(201).json(ticket);
      });
    });
  } catch (error) {
    console.error('Error in POST /tickets:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/tickets/:id - Update ticket
router.put('/:id', async (req, res) => {
  try {
    const db = database.getDatabase();
    const ticketId = req.params.id;
    const {
      title,
      description,
      summary,
      category,
      priority,
      status,
      assigned_to
    } = req.body;

    // First, get the current ticket to check if assignment is changing
    const currentTicketQuery = `
      SELECT 
        t.*,
        assignee.email as current_assignee_email,
        assignee.username as current_assignee_username
      FROM tickets t
      LEFT JOIN users assignee ON t.assigned_to = assignee.id
      WHERE t.id = ?
    `;

    const currentTicket = await new Promise((resolve, reject) => {
      db.get(currentTicketQuery, [ticketId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!currentTicket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Build dynamic update query
    const updates = [];
    const params = [];
    let isAssignmentChanging = false;

    if (title !== undefined) {
      updates.push('title = ?');
      params.push(title);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    if (summary !== undefined) {
      updates.push('summary = ?');
      params.push(summary);
    }
    if (category !== undefined) {
      updates.push('category = ?');
      params.push(category);
    }
    if (priority !== undefined) {
      updates.push('priority = ?');
      params.push(priority);
    }
    if (status !== undefined) {
      updates.push('status = ?');
      params.push(status);
      
      // Set resolved_at if status is being set to resolved
      if (status === 'resolved') {
        updates.push('resolved_at = CURRENT_TIMESTAMP');
      } else if (status !== 'resolved') {
        updates.push('resolved_at = NULL');
      }
    }
    if (assigned_to !== undefined) {
      updates.push('assigned_to = ?');
      params.push(assigned_to);
      
      // Check if assignment is actually changing
      isAssignmentChanging = currentTicket.assigned_to !== assigned_to && assigned_to !== null;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(ticketId);

    const query = `UPDATE tickets SET ${updates.join(', ')} WHERE id = ?`;

    await new Promise((resolve, reject) => {
      db.run(query, params, function(err) {
        if (err) reject(err);
        else resolve(this);
      });
    });

    // Fetch updated ticket with full details
    const fetchQuery = `
      SELECT 
        t.*,
        creator.username as created_by_username,
        creator.email as created_by_email,
        assignee.username as assigned_to_username,
        assignee.email as assigned_to_email
      FROM tickets t
      LEFT JOIN users creator ON t.created_by = creator.id
      LEFT JOIN users assignee ON t.assigned_to = assignee.id
      WHERE t.id = ?
    `;

    const updatedTicket = await new Promise((resolve, reject) => {
      db.get(fetchQuery, [ticketId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    // Send notification if assignment changed
    if (isAssignmentChanging && updatedTicket.assigned_to_email) {
      try {
        console.log('🔔 Ticket assignment notification triggered');
        console.log(`Ticket #${ticketId} assigned to ${updatedTicket.assigned_to_username} (${updatedTicket.assigned_to_email})`);
        
        // Call MCP tool for Gmail notification
        const { spawn } = require('child_process');
        const mcpServerPath = '/Users/I584318/Documents/Cline/MCP/gmail-notifications-server/build/index.js';
        
        // Prepare notification data
        const notificationData = {
          ticketId: parseInt(ticketId),
          assigneeEmail: updatedTicket.assigned_to_email,
          assigneeName: updatedTicket.assigned_to_username,
          ticketTitle: updatedTicket.title,
          ticketDescription: updatedTicket.description,
          priority: updatedTicket.priority,
          category: updatedTicket.category,
          creatorName: updatedTicket.created_by_username,
          createdAt: updatedTicket.created_at
        };

        // Create MCP request
        const mcpRequest = {
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/call',
          params: {
            name: 'send_assignment_notification',
            arguments: notificationData
          }
        };

        // Spawn MCP server process
        const mcpProcess = spawn('node', [mcpServerPath], {
          stdio: ['pipe', 'pipe', 'pipe']
        });

        // Send request to MCP server
        mcpProcess.stdin.write(JSON.stringify(mcpRequest) + '\n');
        mcpProcess.stdin.end();

        // Handle MCP server response
        let responseData = '';
        mcpProcess.stdout.on('data', (data) => {
          responseData += data.toString();
        });

        mcpProcess.on('close', (code) => {
          if (code === 0 && responseData) {
            try {
              const response = JSON.parse(responseData);
              console.log('Gmail notification sent successfully:', response);
            } catch (parseError) {
              console.log('Gmail notification response:', responseData);
            }
          }
        });

        mcpProcess.stderr.on('data', (data) => {
          console.error('MCP server error:', data.toString());
        });

      } catch (notificationError) {
        console.error('Failed to send assignment notification:', notificationError);
        // Don't fail the ticket update if notification fails
      }
    }

    res.json(updatedTicket);
  } catch (error) {
    console.error('Error in PUT /tickets/:id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/tickets/:id - Delete ticket
router.delete('/:id', (req, res) => {
  try {
    const db = database.getDatabase();
    const ticketId = req.params.id;

    const query = 'DELETE FROM tickets WHERE id = ?';

    db.run(query, [ticketId], function(err) {
      if (err) {
        console.error('Error deleting ticket:', err);
        return res.status(500).json({ error: 'Failed to delete ticket' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Ticket not found' });
      }

      res.json({ message: 'Ticket deleted successfully' });
    });
  } catch (error) {
    console.error('Error in DELETE /tickets/:id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/tickets/:id/comments - Add comment to ticket
router.post('/:id/comments', (req, res) => {
  try {
    const db = database.getDatabase();
    const ticketId = req.params.id;
    const { content, user_id } = req.body;

    if (!content || !user_id) {
      return res.status(400).json({ error: 'Content and user_id are required' });
    }

    const query = `
      INSERT INTO comments (ticket_id, user_id, content)
      VALUES (?, ?, ?)
    `;

    db.run(query, [ticketId, user_id, content], function(err) {
      if (err) {
        console.error('Error adding comment:', err);
        return res.status(500).json({ error: 'Failed to add comment' });
      }

      // Fetch the created comment with user details
      const fetchQuery = `
        SELECT 
          c.*,
          u.username,
          u.email
        FROM comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.id = ?
      `;

      db.get(fetchQuery, [this.lastID], (err, comment) => {
        if (err) {
          console.error('Error fetching created comment:', err);
          return res.status(500).json({ error: 'Comment created but failed to fetch details' });
        }

        res.status(201).json(comment);
      });
    });
  } catch (error) {
    console.error('Error in POST /tickets/:id/comments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
