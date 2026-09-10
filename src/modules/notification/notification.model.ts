import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../../config/database.js';

export type NotificationType = 'system' | 'reward' | 'friend_request' | 'game_invite' | 'match_result';

export interface INotificationAttributes {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  data?: Record<string, any> | null;
  isRead: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface INotificationCreationAttributes
  extends Optional<INotificationAttributes, 'id' | 'type' | 'data' | 'isRead' | 'createdAt' | 'updatedAt'> {}

export class Notification
  extends Model<INotificationAttributes, INotificationCreationAttributes>
  implements INotificationAttributes
{
  declare id: string;
  declare userId: string;
  declare title: string;
  declare message: string;
  declare type: NotificationType;
  declare data?: Record<string, any> | null;
  declare isRead: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  get _id(): string {
    return this.id;
  }
}

Notification.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('system', 'reward', 'friend_request', 'game_invite', 'match_result'),
      allowNull: false,
      defaultValue: 'system',
    },
    data: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize,
    tableName: 'notifications',
    indexes: [
      {
        fields: ['userId', 'isRead'],
      },
      {
        fields: ['createdAt'],
      },
    ],
  }
);

export type INotificationDocument = Notification;
