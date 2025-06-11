import { User, Space } from '../types';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { Error } from '@types/node';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Type definitions for JWT
interface JWTUser {
  userId: string;
}

// Type definitions for AuthResponse
interface AuthResponse {
  token: string;
  user: User;
  spaces: Space[];
}

  }

  getAllUsers(): User[] {
    return Array.from(this.users.values());
  }

  getUserById(userId: string): User | null {
    return this.users.get(userId) || null;
  }

  getUserByUsername(username: string): User | null {
    return this.users.get(username) || null;
  }

  updateUserPosition(userId: string, position: { x: number, y: number }): void {
    const user = this.users.get(userId);
    if (user) {
      user.position = position;
      user.lastSeen = new Date();
    }
  }
export class AuthService {
  private databaseService: DatabaseService;

  constructor(databaseService: DatabaseService) {
    this.databaseService = databaseService;
  }

  async signup(username: string, password: string, type: 'admin' | 'user'): Promise<AuthResponse> {
    if (!username || !password) {
      throw new Error('Username and password are required');
    }

    const existingUser = await this.databaseService.getUserByUsername(username);
    if (existingUser) {
      throw new Error('Username already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user: User = {
      id: randomUUID(),
      username,
      password: hashedPassword,
      type,
      lastSeen: new Date()
    };

    await this.databaseService.createUser(user);

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });
    return { token, user, spaces: [] };
  }

  async signin(username: string, password: string): Promise<AuthResponse> {
    const user = await this.databaseService.getUserByUsername(username);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    user.lastSeen = new Date();
    await this.databaseService.updateUser(user.id, { lastSeen: user.lastSeen });
    
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });
    return { token, user, spaces: [] };
  }

  async verifyToken(token: string): Promise<string> {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      return decoded.userId;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  async getAllUsers(): Promise<User[]> {
    return await this.databaseService.getAllUsers();
  }

  async getUserById(userId: string): Promise<User | null> {
    return await this.databaseService.getUserById(userId);
  }

  async getUserByUsername(username: string): Promise<User | null> {
    return await this.databaseService.getUserByUsername(username);
  }

  async updateUserPosition(userId: string, position: { x: number, y: number }): Promise<void> {
    await this.databaseService.updateUserPosition(userId, position);
  }

  async getUsersBySpace(spaceId: string): Promise<User[]> {
    return await this.databaseService.getUsersBySpace(spaceId);
  }
}
