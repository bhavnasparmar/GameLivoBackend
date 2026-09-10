import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../../config/database.js';

export type ChatMessageType = 'text' | 'emoji' | 'system';

export interface IChatMessageAttributes {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  message: string;
  type: ChatMessageType;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IChatMessageCreationAttributes
  extends Optional<IChatMessageAttributes, 'id' | 'senderAvatar' | 'type' | 'createdAt' | 'updatedAt'> {}

export class ChatMessage
  extends Model<IChatMessageAttributes, IChatMessageCreationAttributes>
  implements IChatMessageAttributes
{
  declare id: string;
  declare roomId: string;
  declare senderId: string;
  declare senderName: string;
  declare senderAvatar: string;
  declare message: string;
  declare type: ChatMessageType;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  get _id(): string {
    return this.id;
  }
}

ChatMessage.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    roomId: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    senderId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    senderName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    senderAvatar: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: 'avatar_default_1',
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('text', 'emoji', 'system'),
      allowNull: false,
      defaultValue: 'text',
    },
  },
  {
    sequelize,
    tableName: 'chat_messages',
    indexes: [
      {
        fields: ['roomId', 'createdAt'],
      },
    ],
  }
);

export type IChatMessageDocument = ChatMessage;
