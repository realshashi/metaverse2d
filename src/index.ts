import express from 'express';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { AuthService, User, AuthResponse } from './services/auth';
import { SpaceService } from './services/space';
import { AvatarService } from './services/avatar';
import { AdminService } from './services/admin';
import { Space, Element, Avatar } from './types';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { Error } from 'node:util';

// Type definitions for Express request/response
interface AuthRequest extends Request {
  user?: User;
}

interface AuthResponse extends Response {
  user?: User;
}

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(express.json());

// Initialize services
const authService = new AuthService();
const spaceService = new SpaceService(authService);
const avatarService = new AvatarService();
const adminService = new AdminService(authService);

// Set socket in space service for real-time updates
spaceService.setSocket(io);

// JWT middleware
const verifyToken = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { userId: string };
    req['userId'] = decoded.userId;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Authentication routes
app.post('/api/v1/signup', async (req, res) => {
  try {
    const { username, password, type } = req.body;
    const user = await authService.signup(username, password, type);
    const spaces = await spaceService.getSpacesForUser(user.id);
    const result: AuthResponse = {
      token: user.token,
      user,
      spaces
    };
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/v1/signin', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await authService.signin(username, password);
    const spaces = await spaceService.getSpacesForUser(user.id);
    const result: AuthResponse = {
      token: user.token,
      user,
      spaces
    };
    res.status(200).json(result);
  } catch (error) {
    res.status(403).json({ error: error.message });
  }
});

// Space routes
app.post('/api/v1/space', verifyToken, async (req, res) => {
  try {
    const { name, description, options } = req.body;
    const space = await spaceService.createSpace(req['userId'], name, description, options);
    res.status(200).json(space);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/v1/space/join', verifyToken, async (req, res) => {
  try {
    const { spaceId, password } = req.body;
    const space = await spaceService.joinSpace(req['userId'], spaceId, password);
    res.status(200).json(space);
  } catch (error) {
    res.status(403).json({ error: error.message });
  }
});

app.post('/api/v1/space/leave', verifyToken, async (req, res) => {
  try {
    const { spaceId } = req.body;
    await spaceService.leaveSpace(req['userId'], spaceId);
    res.status(200).json({ message: 'Left space successfully' });
  } catch (error) {
    res.status(403).json({ error: error.message });
  }
});

app.post('/api/v1/space/element', verifyToken, async (req, res) => {
  try {
    const { spaceId, element } = req.body;
    const newElement = await spaceService.addElement(req['userId'], spaceId, element);
    res.status(200).json(newElement);
  } catch (error) {
    res.status(403).json({ error: error.message });
  }
});

app.post('/api/v1/space/element/update', verifyToken, async (req, res) => {
  try {
    const { elementId, updates } = req.body;
    const element = await spaceService.updateElement(req['userId'], elementId, updates);
    res.status(200).json(element);
  } catch (error) {
    res.status(403).json({ error: error.message });
  }
});

app.delete('/api/v1/space/:spaceId', verifyToken, async (req, res) => {
  try {
    await spaceService.deleteSpace(req['userId'], req.params.spaceId);
    res.status(200).json({ message: 'Space deleted successfully' });
  } catch (error) {
    res.status(403).json({ error: error.message });
  }
});

// Avatar routes
app.post('/api/v1/metadata', async (req, res) => {
  try {
    const { imageUrl, name, animations } = req.body;
    const avatar = await avatarService.createAvatar(imageUrl, name, animations);
    res.status(200).json({ 
      avatarId: avatar.id,
      avatar
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/v1/metadata/update', verifyToken, async (req, res) => {
  try {
    const { avatarId, position } = req.body;
    const avatar = await avatarService.getAvatar(avatarId);
    if (!avatar) {
      throw new Error('Avatar not found');
    }
    
    // Update user position
    const user = authService.users.get(req['userId']);
    if (user) {
      user.position = position;
      user.lastSeen = new Date();
    }
    
    res.status(200).json({ avatarId });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Admin routes
app.post('/api/v1/admin/user/role', verifyToken, async (req, res) => {
  try {
    const { userId, role } = req.body;
    await adminService.updateUserRole(userId, role);
    res.status(200).json({ message: 'User role updated successfully' });
  } catch (error) {
    res.status(403).json({ error: error.message });
  }
});

app.post('/api/v1/admin/element', verifyToken, async (req, res) => {
  try {
    const { elementId, updates } = req.body;
    await adminService.updateElement(elementId, updates);
    res.status(200).json({ message: 'Element updated successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// WebSocket handlers
io.on('connection', (socket) => {
  console.log('New WebSocket client connected');

  socket.on('join-space', (spaceId: string) => {
    socket.join(spaceId);
    console.log(`Client joined space: ${spaceId}`);
  });

  socket.on('leave-space', (spaceId: string) => {
    socket.leave(spaceId);
    console.log(`Client left space: ${spaceId}`);
  });

  socket.on('user-position-update', (userId: string, position: { x: number, y: number }) => {
    const user = authService.users.get(userId);
    if (user) {
      user.position = position;
      user.lastSeen = new Date();
      
      // Broadcast position update to all users in the same space
      if (user.currentSpaceId) {
        io.to(user.currentSpaceId).emit('user-position-updated', {
          userId,
          position
        });
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Start server
const PORT = process.env.PORT || 3000;
const WS_PORT = process.env.WS_PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`WebSocket server running on ws://localhost:${WS_PORT}`);
});
