import { User, Element } from '../types';
import { AuthService } from './auth';

export class AdminService {
  constructor(private authService: AuthService) {}

  async updateUserRole(userId: string, role: 'admin' | 'user'): Promise<void> {
    const user = this.authService.getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    user.type = role;
  }

  async updateElement(elementId: string, updates: Partial<Element>): Promise<void> {
    const element = this.authService.elements.get(elementId);
    if (!element) {
      throw new Error('Element not found');
    }

    Object.assign(element, updates);
  }

  async deleteUser(userId: string): Promise<void> {
    const user = this.authService.getUserById(userId);
    const user = this.authService.users.get(userId);
    if (!user) {
      throw new Error('User not found');
    }

    this.authService.users.delete(userId);
  }
}
