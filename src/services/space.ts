import { Space, Element, User } from '../types';
import { AuthService } from './auth';

export class SpaceService {
  private spaces: Map<string, Space> = new Map();
  private elements: Map<string, Element> = new Map();
  private usersInSpaces: Map<string, Set<string>> = new Map(); // spaceId -> userIds
  private socket: any;

  constructor(private authService: AuthService) {}

  setSocket(socket: any): void {
    this.socket = socket;
  }

  getSpacesForUser(userId: string): Space[] {
    const user = this.authService.getUserById(userId);
    if (!user) return [];

    return Array.from(this.spaces.values()).filter(space => 
      space.users.has(userId) || 
      (space.privacy === 'public' && !space.password)
    );
  }

  async createSpace(userId: string, name: string, description: string, options: {
    background: string;
    maxUsers: number;
    privacy: 'public' | 'private';
    password?: string;
  }): Promise<Space> {
    const space: Space = {
      id: crypto.randomUUID(),
      name,
      description,
      createdById: userId,
      createdAt: new Date(),
      elements: [],
      users: new Set([userId]),
      background: options.background,
      maxUsers: options.maxUsers,
      privacy: options.privacy,
      password: options.password
    };

    this.spaces.set(space.id, space);
    this.usersInSpaces.set(space.id, new Set([userId]));

    // Broadcast space creation to all users
    if (this.socket) {
      this.socket.emit('space-created', space);
    }

    return space;
  }

  async joinSpace(userId: string, spaceId: string, password?: string): Promise<Space> {
    const space = this.spaces.get(spaceId);
    if (!space) {
      throw new Error('Space not found');
    }

    if (space.private && space.password && space.password !== password) {
      throw new Error('Invalid password');
    }

    if (space.users.length >= space.maxUsers) {
      throw new Error('Space is full');
    }

    const user = this.authService.users.get(userId);
    if (!user) {
      throw new Error('User not found');
    }

    user.currentSpaceId = spaceId;
    space.users.push(user);

    // Broadcast user join to all users in the space
    this.socket.to(spaceId).emit('user-joined', user);

    return space;
  }

  async leaveSpace(userId: string, spaceId: string): Promise<void> {
    const space = this.spaces.get(spaceId);
    if (!space) {
      throw new Error('Space not found');
    }

    const userIndex = space.users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
      space.users.splice(userIndex, 1);
      const user = this.authService.users.get(userId);
      if (user) {
        user.currentSpaceId = undefined;
      }

      // Broadcast user left to all users in the space
      this.socket.to(spaceId).emit('user-left', userId);
    }
  }

  async addElement(userId: string, spaceId: string, element: Partial<Element>): Promise<Element> {
    const space = this.spaces.get(spaceId);
    if (!space) {
      throw new Error('Space not found');
    }

    if (space.creatorId !== userId) {
      throw new Error('Unauthorized to add element to this space');
    }

    const newElement: Element = {
      id: crypto.randomUUID(),
      spaceId,
      type: 'object',
      imageUrl: '',
      position: { x: 0, y: 0 },
      size: { width: 100, height: 100 },
      ...element
    };

    this.elements.set(newElement.id, newElement);
    space.elements.push(newElement);

    // Broadcast element added to all users in the space
    this.socket.to(spaceId).emit('element-added', newElement);

    return newElement;
  }

  async updateElement(userId: string, elementId: string, updates: Partial<Element>): Promise<Element> {
    const element = this.elements.get(elementId);
    if (!element) {
      throw new Error('Element not found');
    }

    const space = this.spaces.get(element.spaceId);
    if (!space) {
      throw new Error('Space not found');
    }

    if (space.creatorId !== userId) {
      throw new Error('Unauthorized to update element');
    }

    Object.assign(element, updates);
    this.elements.set(elementId, element);

    // Broadcast element update to all users in the space
    this.socket.to(element.spaceId).emit('element-updated', element);

    return element;
  }

  async deleteSpace(userId: string, spaceId: string): Promise<void> {
    const space = this.spaces.get(spaceId);
    if (!space) {
      throw new Error('Space not found');
    }

    if (space.creatorId !== userId) {
      throw new Error('Unauthorized to delete space');
    }

    // Broadcast space deletion to all users
    this.socket.to(spaceId).emit('space-deleted');

    this.spaces.delete(spaceId);
    space.elements.forEach(element => this.elements.delete(element.id));
    space.users.forEach(user => {
      user.currentSpaceId = undefined;
    });
  }
}
