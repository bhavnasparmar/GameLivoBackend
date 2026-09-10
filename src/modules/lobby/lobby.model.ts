import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../../config/database.js';

export interface ILobbyPlayer {
  userId: string;
  username: string;
  avatar: string;
  seatIndex: number;
  isReady: boolean;
  isHost: boolean;
  socketId?: string;
  joinedAt: Date | string;
}

export type LobbyStatus = 'waiting' | 'starting' | 'in_game' | 'closed';

export interface ILobbyAttributes {
  id: string;
  code: string;
  gameId: string;
  mode: string;
  hostId: string;
  maxPlayers: number;
  minPlayers: number;
  entryFee: number;
  prizePool: number;
  isPrivate: boolean;
  status: LobbyStatus;
  players: ILobbyPlayer[];
  currentMatchId?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ILobbyCreationAttributes
  extends Optional<
    ILobbyAttributes,
    'id' | 'mode' | 'maxPlayers' | 'minPlayers' | 'entryFee' | 'prizePool' | 'isPrivate' | 'status' | 'players' | 'currentMatchId' | 'createdAt' | 'updatedAt'
  > {}

export class Lobby extends Model<ILobbyAttributes, ILobbyCreationAttributes> implements ILobbyAttributes {
  declare id: string;
  declare code: string;
  declare gameId: string;
  declare mode: string;
  declare hostId: string;
  declare maxPlayers: number;
  declare minPlayers: number;
  declare entryFee: number;
  declare prizePool: number;
  declare isPrivate: boolean;
  declare status: LobbyStatus;
  declare players: ILobbyPlayer[];
  declare currentMatchId?: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  get _id(): string {
    return this.id;
  }
}

Lobby.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    code: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    gameId: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    mode: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'classic',
    },
    hostId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    maxPlayers: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 4,
    },
    minPlayers: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 2,
    },
    entryFee: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    prizePool: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    isPrivate: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    status: {
      type: DataTypes.ENUM('waiting', 'starting', 'in_game', 'closed'),
      allowNull: false,
      defaultValue: 'waiting',
    },
    players: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
    currentMatchId: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'lobbies',
    indexes: [
      {
        unique: true,
        fields: ['code'],
      },
      {
        fields: ['status', 'isPrivate'],
      },
      {
        fields: ['gameId'],
      },
    ],
  }
);

export type ILobbyDocument = Lobby;
