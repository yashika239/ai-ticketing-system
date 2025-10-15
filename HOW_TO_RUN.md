# 🚀 How to Run the AI Ticket System with Gmail Notifications

## 📋 **Prerequisites**
- Node.js (v14 or higher)
- npm (comes with Node.js)
- SQLite3 (for database)

## 🏃‍♂️ **Quick Start Guide**

### **Step 1: Start the Backend Server**
```bash
cd /Users/I584318/Projects/ticketsystem
npm run server
```
This will start the backend API server on `http://localhost:5002`

### **Step 2: Start the Frontend (New Terminal)**
```bash
cd /Users/I584318/Projects/ticketsystem
npm run client
```
This will start the React frontend on `http://localhost:3000`

### **Step 3: Access the Application**
Open your browser and go to: `http://localhost:3000` (NOT port 5002!)

**Important Notes:**
- ✅ **Frontend (Web Interface)**: `http://localhost:3000` ← Use this!
- ⚠️ **Backend (API Only)**: `http://localhost:5002` ← This is just for API calls
- ✅ **Health Check**: `http://localhost:5002/api/health` ← To verify backend is running

**Default Login Credentials:**
- Username: `admin`
- Password: `admin123`

## 📧 **Gmail Notifications Status**

The Gmail notification system is **ALREADY RUNNING** automatically! Here's what's happening:

### **🔄 Automatic Operation**
- The MCP server is **automatically started** by Cline when you use the system
- Gmail notifications are **integrated into the ticket assignment process**
- When you assign a ticket to someone, notifications are **automatically triggered**

### **📊 Current Mode: Demo**
- Notifications are currently in **demo mode** (console logging)
- You'll see notification messages in the server terminal when tickets are assigned
- No actual emails are sent (perfect for testing!)

## 🎯 **How to Test Gmail Notifications**

### **Method 1: Via Web Interface**
1. **Login** to the system at `http://localhost:3000`
2. **Create a new ticket** or open an existing one
3. **Assign the ticket** to a user (admin or create a new user)
4. **Check the server terminal** - you'll see the notification message!

### **Method 2: Via API (Advanced)**
```bash
# Update a ticket to assign it to user ID 1
curl -X PUT http://localhost:5002/api/tickets/1 \
  -H "Content-Type: application/json" \
  -d '{"assigned_to": 1}'
```

### **Method 3: Direct MCP Tool Test**
The MCP tool is available and can be tested directly (as we demonstrated earlier).

## 🖥️ **Complete Startup Sequence**

### **Terminal 1: Backend Server**
```bash
cd /Users/I584318/Projects/ticketsystem
npm run server
```
**Expected Output:**
```
🚀 Server running on port 5002
📊 Health check: http://localhost:5002/api/health
✅ Connected to SQLite database
✅ Users table created
✅ Tickets table created
✅ Comments table created
✅ Attachments table created
✅ Default admin user created (username: admin, password: admin123)
```

### **Terminal 2: Frontend Client**
```bash
cd /Users/I584318/Projects/ticketsystem
npm run client
```
**Expected Output:**
```
Compiled successfully!

You can now view client in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.x.x:3000

Note that the development build is not optimized.
To create a production build, use npm run build.
```

## 🔔 **Gmail Notification Workflow**

### **What Happens When You Assign a Ticket:**

1. **User Action**: You assign a ticket via the web interface
2. **Backend Processing**: Server detects the assignment change
3. **MCP Integration**: System automatically calls the Gmail notification MCP tool
4. **Notification Delivery**: 
   - **Demo Mode**: Logs notification details to server console
   - **Production Mode**: Sends actual Gmail (requires API setup)
5. **User Experience**: Assignee receives professional email notification

### **Example Console Output:**
```
🔔 Ticket assignment notification triggered
Ticket #2 assigned to testuser (testuser@example.com)

=== TICKET ASSIGNMENT NOTIFICATION (Demo Mode) ===
To: testuser@example.com
Subject: 🎫 Ticket Assigned: Email notification test ticket
---
Hi Test User,

You have been assigned a new support ticket:

📋 Ticket Details:
• ID: #2
• Title: Email notification test ticket
• Priority: High
• Category: Bug
• Created by: Admin
• Created: 10/15/2025

📝 Description:
This ticket is created to test the Gmail notification system...

🔗 View Ticket: http://localhost:3000/tickets/2

Please review and take appropriate action.

Best regards,
AI Ticket System
=== END NOTIFICATION ===
```

## 🛠️ **Troubleshooting**

### **If Backend Won't Start:**
```bash
# Check if port 5002 is in use
lsof -i :5002

# Kill any process using the port
kill -9 <PID>

# Try starting again
npm run server
```

### **If Frontend Won't Start:**
```bash
# Check if port 3000 is in use
lsof -i :3000

# Kill any process using the port
kill -9 <PID>

# Try starting again
npm run client
```

### **If Database Issues:**
```bash
# Check if database file exists
ls -la server/database/tickets.db

# If missing, restart the server to recreate it
npm run server
```

## 🎯 **Testing Checklist**

- [ ] Backend server starts successfully on port 5002
- [ ] Frontend starts successfully on port 3000
- [ ] Can login with admin/admin123
- [ ] Dashboard loads with statistics
- [ ] Can create new tickets
- [ ] Can assign tickets to users
- [ ] Gmail notification appears in server console when assigning tickets
- [ ] All features work without errors

## 🚀 **Production Setup (Optional)**

To enable **actual Gmail delivery** instead of demo mode:

1. **Set up Google Cloud Console project**
2. **Enable Gmail API**
3. **Create OAuth2 credentials**
4. **Get refresh token**
5. **Update MCP settings** with credentials

For now, the demo mode is perfect for testing and development!

---

## 🎉 **You're All Set!**

The system is **ready to run** with Gmail notifications fully integrated. Just start both servers and begin using your AI-powered ticket system with automatic email notifications! 📧✨
