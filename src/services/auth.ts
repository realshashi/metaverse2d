import { User } from '../types';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
// Using built-in Error type instead of importing from node:util
// import { Error } from 'node:util';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Type definitions for JWT
interface JWTUser {
  userId: string;
}

// Type definitions for AuthResponse
interface AuthResponse {
  token: string;
  user: User;
  spaces: any[];
}

export class AuthService {
  private users: Map<string, User>;

  constructor() {
    this.users = new Map();
  }

  async signup(username: string, password: string, type: 'admin' | 'user'): Promise<AuthResponse> {
    if (!username || !password) {
      throw new Error('Username and password are required');
    }

    if (this.users.has(username)) {
      throw new Error('Username already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user: User = {
      id: crypto.randomUUID(),
      username,
      password: hashedPassword,
      type,
      lastSeen: new Date()
    };

    this.users.set(username, user);

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });
    return { token, user, spaces: [] };
  }

  async signin(username: string, password: string): Promise<AuthResponse> {
    const user = this.users.get(username);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    user.lastSeen = new Date();
    
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });
    return { token, user, spaces: [] };
  }

  verifyToken(token: string): string {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      return decoded.userId;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  getAllUsers(): User[] {
    return Array.from(this.users.values());
  }

  getUserById(userId: string): User | null {
    const user = Array.from(this.users.values()).find(u => u.id === userId);
    return user || null;
  }

  updateUserPosition(userId: string, position: { x: number, y: number }): void {
    const user = this.users.get(userId);
    if (user) {
      user.position = position;
      user.lastSeen = new Date();
    }
  }

  // Add this method to get users by space
  getUsersBySpace(spaceId: string): User[] {
    return Array.from(this.users.values()).filter(user => user.currentSpaceId === spaceId);
  }
}
