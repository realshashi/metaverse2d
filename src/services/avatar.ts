import { Avatar, User } from '../types';

export class AvatarService {
  private avatars: Map<string, Avatar> = new Map();

  async createAvatar(imageUrl: string, name: string, animations: {
    idle: string;
    walk: string;
    interact: string;
  }): Promise<Avatar> {
    const avatar: Avatar = {
      id: crypto.randomUUID(),
      imageUrl,
      name,
      animations: {
        idle: animations.idle || `${imageUrl}/idle.png`,
        walk: animations.walk || `${imageUrl}/walk.png`,
        interact: animations.interact || `${imageUrl}/interact.png`
      }
    };

    this.avatars.set(avatar.id, avatar);
    return avatar;
  }

  async getAvatar(avatarId: string): Promise<Avatar | null> {
    return this.avatars.get(avatarId) || null;
  }

  async updateAvatar(avatarId: string, updates: Partial<Avatar>): Promise<Avatar> {
    const avatar = this.avatars.get(avatarId);
    if (!avatar) {
      throw new Error('Avatar not found');
    }

    Object.assign(avatar, updates);
    return avatar;
  }

  async updateAvatarAnimations(avatarId: string, animations: Partial<Avatar['animations']>): Promise<Avatar> {
    const avatar = this.avatars.get(avatarId);
    if (!avatar) {
      throw new Error('Avatar not found');
    }

    avatar.animations = { ...avatar.animations, ...animations };
    return avatar;
  }
}
