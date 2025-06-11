import { Space, Element, User } from '../types';
import { DatabaseService } from './database';
import { randomUUID } from 'crypto';

export class SpaceService {
  private databaseService: DatabaseService;

  constructor(databaseService: DatabaseService) {
    this.databaseService = databaseService;
  }

  async createSpace(
    creatorId: string,
    name: string,
    background: string,
    maxUsers: number,
    privateSpace: boolean,
    password: string
  ): Promise<Space> {
    const space: Space = {
      id: randomUUID(),
      name,
      background,
      maxUsers,
      private: privateSpace,
      password,
      users: new Set<string>(),
      elements: new Set<Element>(),
      creatorId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return await this.databaseService.createSpace(space);
  }

  async getSpacesForUser(userId: string): Promise<Space[]> {
    return await this.databaseService.getSpacesByUserId(userId);
  }

  async joinSpace(userId: string, spaceId: string, password?: string): Promise<Space> {
    const space = await this.databaseService.getSpaceById(spaceId);
    if (!space) {
      throw new Error('Space not found');
    }

    if (space.private && space.password && space.password !== password) {
      throw new Error('Invalid password');
    }

    if (space.users.size >= space.maxUsers) {
      throw new Error('Space is full');
    }

    await this.databaseService.addUserToSpace(userId, spaceId);
    return space;
  }

  async leaveSpace(userId: string, spaceId: string): Promise<void> {
    await this.databaseService.removeUserFromSpace(userId, spaceId);
  }

  async addElement(userId: string, spaceId: string, element: Element): Promise<Element> {
    const space = await this.databaseService.getSpaceById(spaceId);
    if (!space) {
      throw new Error('Space not found');
    }

    if (!space.users.has(userId)) {
      throw new Error('User not in space');
    }

    element.id = randomUUID();
    await this.databaseService.createElement(spaceId, element);
    return element;
  }

  async updateElement(userId: string, spaceId: string, elementId: string, updates: Partial<Element>): Promise<void> {
    const space = await this.databaseService.getSpaceById(spaceId);
    if (!space) {
      throw new Error('Space not found');
    }

    if (!space.users.has(userId)) {
      throw new Error('User not in space');
    }

    await this.databaseService.updateElement(elementId, updates);
  }

  async deleteSpace(userId: string, spaceId: string): Promise<void> {
    const space = await this.databaseService.getSpaceById(spaceId);
    if (!space) {
      throw new Error('Space not found');
    }

    if (space.creatorId !== userId) {
      throw new Error('Only creator can delete space');
    }

    await this.databaseService.deleteSpace(spaceId);
  }

  async updateUserPosition(userId: string, position: { x: number; y: number }): Promise<void> {
    await this.databaseService.updateUserPosition(userId, position);
  }
}
