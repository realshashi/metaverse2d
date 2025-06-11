export interface User {
  id: string;
  username: string;
  password: string;
  type: 'admin' | 'user';
  avatarId?: string;
  currentSpaceId?: string;
  position?: {
    x: number;
    y: number;
  };
  lastSeen: Date;
}

export interface Avatar {
  id: string;
  imageUrl: string;
  name: string;
  animations: {
    idle: string;
    walk: string;
    interact: string;
  };
}

export interface Space {
  id: string;
  name: string;
  background: string;
  maxUsers: number;
  private: boolean;
  password?: string;
  creatorId: string;
  createdAt: Date;
  updatedAt: Date;
  users: Set<string>;
  elements: Set<Element>;
}

export interface Element {
  id: string;
  spaceId: string;
  imageUrl: string;
  position: {
    x: number;
    y: number;
  };
  size?: {
    width: number;
    height: number;
  };
  rotation?: number;
  createdAt: Date;
  interactions?: {
    clickable?: boolean;
    draggable?: boolean;
    hoverable?: boolean;
    onInteract?: string;
  };
}

export interface AuthResponse {
  token: string;
  user: User;
  spaces: Space[];
}

export interface MetadataResponse {
  avatarId: string;
  avatar: Avatar;
}
