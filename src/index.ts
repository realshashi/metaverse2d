import express from 'express';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { randomUUID } from 'crypto';
import { AuthResponse } from './types';
import { AuthService } from './services/auth';
import { SpaceService } from './services/space';
import jwt from 'jsonwebtoken';
import { DatabaseService } from './services/database';

interface CustomResponse extends express.Response {
  userId?: string;
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

// Auth middleware
app.use((req: express.Request, res: CustomResponse, next: express.NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { userId: string };
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    res.userId = decoded.userId;
    next();
  } catch (error: unknown) {
    return res.status(401).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Initialize services
const databaseService = new DatabaseService();
const authService = new AuthService(databaseService);
const spaceService = new SpaceService(databaseService);

// Routes
app.post('/api/auth/signup', async (req: express.Request, res: express.Response) => {
  try {
    const { username, password, type } = req.body;
    const response = await authService.signup(username, password, type);
    res.json(response);
  } catch (error: unknown) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

app.post('/api/auth/signin', async (req: express.Request, res: express.Response) => {
  try {
    const { username, password } = req.body;
    const response = await authService.signin(username, password);
    res.json(response);
  } catch (error: unknown) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

app.get('/api/spaces', async (req: express.Request, res: CustomResponse) => {
  try {
    const userId = res.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const spaces = await spaceService.getSpacesForUser(userId);
    res.json(spaces);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

app.post('/api/spaces', async (req: express.Request, res: CustomResponse) => {
  try {
    const userId = res.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { name, background, maxUsers, private: privacy, password } = req.body;
    const space = await spaceService.createSpace(
      userId,
      name,
      background,
      maxUsers,
      privacy,
      password
    );
    res.json(space);
  } catch (error: unknown) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

app.post('/api/spaces/:spaceId/join', async (req: express.Request, res: CustomResponse) => {
  try {
    const userId = res.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { password } = req.body;
    const space = await spaceService.joinSpace(userId, req.params.spaceId, password);
    res.json(space);
  } catch (error: unknown) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

app.post('/api/spaces/:spaceId/leave', async (req: express.Request, res: CustomResponse) => {
  try {
    const userId = res.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    await spaceService.leaveSpace(userId, req.params.spaceId);
    res.json({ success: true });
  } catch (error: unknown) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

app.post('/api/spaces/:spaceId/elements', async (req: express.Request, res: CustomResponse) => {
  try {
    const userId = res.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const element = req.body;
    await spaceService.addElement(userId, req.params.spaceId, element);
    res.json({ success: true });
  } catch (error: unknown) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

app.patch('/api/spaces/:spaceId/elements/:elementId', async (req: express.Request, res: CustomResponse) => {
  try {
    const userId = res.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const updates = req.body;
    await spaceService.updateElement(userId, req.params.spaceId, req.params.elementId, updates);
    res.json({ success: true });
  } catch (error: unknown) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

app.delete('/api/spaces/:spaceId', async (req: express.Request, res: CustomResponse) => {
  try {
    const userId = res.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    await spaceService.deleteSpace(userId, req.params.spaceId);
    res.json({ success: true });
  } catch (error: unknown) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// WebSocket connection
io.on('connection', (socket) => {
  socket.on('join-space', async (spaceId) => {
    try {
      const userId = socket.handshake.auth.userId;
      if (!userId) {
        return socket.emit('error', 'Unauthorized');
      }
      const space = await spaceService.joinSpace(userId, spaceId);
      socket.join(spaceId);
      const user = await authService.getUserById(userId);
      socket.to(spaceId).emit('user-joined', {
        userId,
        position: user?.position || { x: 0, y: 0 }
      });
      socket.emit('space-joined', space);
    } catch (error: unknown) {
      socket.emit('error', error instanceof Error ? error.message : 'Unknown error');
    }
  });

  socket.on('leave-space', async (spaceId) => {
    try {
      const userId = socket.handshake.auth.userId;
      if (!userId) {
        return socket.emit('error', 'Unauthorized');
      }
      await spaceService.leaveSpace(userId, spaceId);
      socket.leave(spaceId);
      socket.to(spaceId).emit('user-left', userId);
    } catch (error: unknown) {
      socket.emit('error', error instanceof Error ? error.message : 'Unknown error');
    }
  });

  socket.on('update-position', async (data) => {
    try {
      const { spaceId, position } = data;
      const userId = socket.handshake.auth.userId;
      if (!userId) {
        return socket.emit('error', 'Unauthorized');
      }
      await authService.updateUserPosition(userId, position);
      socket.to(spaceId).emit('user-position-updated', {
        userId,
        position
      });
    } catch (error: unknown) {
      socket.emit('error', error instanceof Error ? error.message : 'Unknown error');
    }
  });

  socket.on('disconnect', async () => {
    try {
      const userId = socket.handshake.auth.userId;
      if (!userId) {
        return;
      }
      const spaces = await spaceService.getSpacesForUser(userId);
      spaces.forEach(space => {
        socket.to(space.id).emit('user-left', userId);
        socket.leave(space.id);
      });
    } catch (error: unknown) {
      // Ignore errors during disconnect
    }
  });
});

// Start server
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
