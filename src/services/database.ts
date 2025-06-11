import { supabase } from '../config/supabase';
import { User, Space, Element } from '../types';

export class DatabaseService {
  // Users
  async createUser(user: User): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: user.id,
        username: user.username,
        type: user.type,
        avatar_id: user.avatarId,
        current_space_id: user.currentSpaceId,
        position: user.position,
        last_seen: user.lastSeen
      })
      .select()
      .single();

    if (error) throw error;
    return data as User;
  }

  async getUserById(userId: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data as User | null;
  }

  async updateUserPosition(userId: string, position: { x: number; y: number }): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({ position })
      .eq('id', userId);

    if (error) throw error;
  }

  async getSpacesByUserId(userId: string): Promise<Space[]> {
    const { data, error } = await supabase
      .from('spaces')
      .select('*')
      .eq('creator_id', userId);

    if (error) throw error;
    return data as Space[];
  }

  // Spaces
  async createSpace(space: Space): Promise<Space> {
    const { data, error } = await supabase
      .from('spaces')
      .insert({
        id: space.id,
        name: space.name,
        background: space.background,
        max_users: space.maxUsers,
        private: space.private,
        password: space.password,
        creator_id: space.creatorId,
        created_at: space.createdAt,
        updated_at: space.updatedAt
      })
      .select()
      .single();

    if (error) throw error;
    return data as Space;
  }

  async getSpaceById(spaceId: string): Promise<Space | null> {
    const { data, error } = await supabase
      .from('spaces')
      .select('*')
      .eq('id', spaceId)
      .single();

    if (error) throw error;
    return data as Space | null;
  }

  async addUserToSpace(userId: string, spaceId: string): Promise<void> {
    const { error } = await supabase
      .from('space_users')
      .insert({
        user_id: userId,
        space_id: spaceId,
        joined_at: new Date()
      });

    if (error) throw error;
  }

  async removeUserFromSpace(userId: string, spaceId: string): Promise<void> {
    const { error } = await supabase
      .from('space_users')
      .delete()
      .eq('user_id', userId)
      .eq('space_id', spaceId);

    if (error) throw error;
  }

  async deleteSpace(spaceId: string): Promise<void> {
    // Delete associated elements first
    await this.deleteElementsBySpace(spaceId);
    
    // Delete space_users relationships
    await this.deleteSpaceUsers(spaceId);
    
    // Delete the space itself
    const { error } = await supabase
      .from('spaces')
      .delete()
      .eq('id', spaceId);

    if (error) throw error;
  }

  // Elements
  async createElement(spaceId: string, element: Element): Promise<Element> {
    const { data, error } = await supabase
      .from('elements')
      .insert({
        space_id: spaceId,
        ...element
      })
      .select()
      .single();

    if (error) throw error;
    return data as Element;
  }

  async updateElement(elementId: string, updates: Partial<Element>): Promise<void> {
    const { error } = await supabase
      .from('elements')
      .update(updates)
      .eq('id', elementId);

    if (error) throw error;
  }

  async deleteElement(elementId: string): Promise<void> {
    const { error } = await supabase
      .from('elements')
      .delete()
      .eq('id', elementId);

    if (error) throw error;
  }

  async deleteElementsBySpace(spaceId: string): Promise<void> {
    const { error } = await supabase
      .from('elements')
      .delete()
      .eq('space_id', spaceId);

    if (error) throw error;
  }

  async deleteSpaceUsers(spaceId: string): Promise<void> {
    const { error } = await supabase
      .from('space_users')
      .delete()
      .eq('space_id', spaceId);

    if (error) throw error;
  }

  async getElementsBySpace(spaceId: string): Promise<Element[]> {
    const { data, error } = await supabase
      .from('elements')
      .select('*')
      .eq('space_id', spaceId);

    if (error) throw error;
    return data as Element[];
  }
}
