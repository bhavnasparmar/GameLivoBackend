import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../../config/database.js';

export interface IFriendRequestAttributes {
  id: string;
  senderId: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IFriendRequestCreationAttributes
  extends Optional<IFriendRequestAttributes, 'id' | 'status' | 'createdAt' | 'updatedAt'> {}

export class FriendRequest
  extends Model<IFriendRequestAttributes, IFriendRequestCreationAttributes>
  implements IFriendRequestAttributes
{
  declare id: string;
  declare senderId: string;
  declare receiverId: string;
  declare status: 'pending' | 'accepted' | 'declined';
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  get _id(): string {
    return this.id;
  }
}

FriendRequest.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    senderId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    receiverId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'accepted', 'declined'),
      allowNull: false,
      defaultValue: 'pending',
    },
  },
  {
    sequelize,
    tableName: 'friend_requests',
    indexes: [
      {
        unique: true,
        fields: ['senderId', 'receiverId'],
      },
      {
        fields: ['receiverId', 'status'],
      },
      {
        fields: ['senderId'],
      },
    ],
  }
);

export type IFriendRequestDocument = FriendRequest;
