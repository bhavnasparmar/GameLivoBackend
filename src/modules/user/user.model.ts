import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../../config/database.js';

export interface IUserGameStats {
  played: number;
  won: number;
  lost: number;
  draw: number;
  winStreak: number;
  highScore: number;
}

export interface IUserSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  vibrationEnabled: boolean;
  notificationsEnabled: boolean;
  language: string;
  theme: 'light' | 'dark' | 'system';
}

export interface IUserAttributes {
  id: string;
  username: string;
  phone?: string | null;
  email?: string | null;
  passwordHash?: string | null;
  avatar: string;
  coins: number;
  diamonds: number;
  level: number;
  xp: number;
  role: 'user' | 'admin' | 'moderator';
  isVerified: boolean;
  isOnline: boolean;
  lastActive: Date;
  referralCode: string;
  referredBy?: string | null;
  friends: string[];
  gameStats: Record<string, IUserGameStats>;
  settings: IUserSettings;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUserCreationAttributes
  extends Optional<
    IUserAttributes,
    | 'id'
    | 'avatar'
    | 'coins'
    | 'diamonds'
    | 'level'
    | 'xp'
    | 'role'
    | 'isVerified'
    | 'isOnline'
    | 'lastActive'
    | 'friends'
    | 'gameStats'
    | 'settings'
    | 'createdAt'
    | 'updatedAt'
  > {}

export class User extends Model<IUserAttributes, IUserCreationAttributes> implements IUserAttributes {
  declare id: string;
  declare username: string;
  declare phone?: string | null;
  declare email?: string | null;
  declare passwordHash?: string | null;
  declare avatar: string;
  declare coins: number;
  declare diamonds: number;
  declare level: number;
  declare xp: number;
  declare role: 'user' | 'admin' | 'moderator';
  declare isVerified: boolean;
  declare isOnline: boolean;
  declare lastActive: Date;
  declare referralCode: string;
  declare referredBy?: string | null;
  declare friends: string[];
  declare gameStats: Record<string, IUserGameStats>;
  declare settings: IUserSettings;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Compatibility alias for MongoDB _id
  get _id(): string {
    return this.id;
  }

  toJSON(): object {
    const values = { ...this.get() };
    delete values.passwordHash;
    return values;
  }
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true,
      validate: {
        len: [3, 30],
      },
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      unique: true,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    avatar: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: 'avatar_default_1',
    },
    coins: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 1000,
      get() {
        const rawValue = this.getDataValue('coins');
        return rawValue !== null && rawValue !== undefined ? Number(rawValue) : 0;
      },
    },
    diamonds: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 50,
    },
    level: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    xp: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    role: {
      type: DataTypes.ENUM('user', 'admin', 'moderator'),
      allowNull: false,
      defaultValue: 'user',
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    isOnline: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    lastActive: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    referralCode: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    referredBy: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    friends: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
      get() {
        const rawValue = this.getDataValue('friends');
        if (!rawValue) return [];
        if (typeof rawValue === 'string') {
          try {
            const parsed = JSON.parse(rawValue);
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            return [];
          }
        }
        return Array.isArray(rawValue) ? rawValue : [];
      },
    },
    gameStats: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {},
    },
    settings: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {
        soundEnabled: true,
        musicEnabled: true,
        vibrationEnabled: true,
        notificationsEnabled: true,
        language: 'en',
        theme: 'dark',
      },
    },
  },
  {
    sequelize,
    tableName: 'users',
    indexes: [
      { unique: true, fields: ['username'] },
      { unique: true, fields: ['phone'] },
      { unique: true, fields: ['email'] },
      { unique: true, fields: ['referralCode'] },
    ],
  }
);

export type IUserDocument = User;
