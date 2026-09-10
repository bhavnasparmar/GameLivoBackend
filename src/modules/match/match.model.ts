import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../../config/database.js';

export interface IMatchPlayer {
  userId: string;
  username: string;
  avatar: string;
  seatIndex: number;
  score: number;
  rank: number;
  coinsWon: number;
  isDisconnected: boolean;
}

export type MatchStatus = 'in_progress' | 'completed' | 'abandoned' | 'cancelled';

export interface IMatchAttributes {
  id: string;
  lobbyId?: string | null;
  gameId: string;
  mode: string;
  status: MatchStatus;
  players: IMatchPlayer[];
  winnerId?: string | null;
  prizePool: number;
  entryFee: number;
  gameState: Record<string, any>;
  currentTurnUserId?: string | null;
  turnDeadline?: Date | null;
  startedAt: Date;
  endedAt?: Date | null;
  durationSeconds?: number | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IMatchCreationAttributes
  extends Optional<
    IMatchAttributes,
    | 'id'
    | 'lobbyId'
    | 'mode'
    | 'status'
    | 'winnerId'
    | 'prizePool'
    | 'entryFee'
    | 'gameState'
    | 'currentTurnUserId'
    | 'turnDeadline'
    | 'startedAt'
    | 'endedAt'
    | 'durationSeconds'
    | 'createdAt'
    | 'updatedAt'
  > {}

export class Match extends Model<IMatchAttributes, IMatchCreationAttributes> implements IMatchAttributes {
  declare id: string;
  declare lobbyId?: string | null;
  declare gameId: string;
  declare mode: string;
  declare status: MatchStatus;
  declare players: IMatchPlayer[];
  declare winnerId?: string | null;
  declare prizePool: number;
  declare entryFee: number;
  declare gameState: Record<string, any>;
  declare currentTurnUserId?: string | null;
  declare turnDeadline?: Date | null;
  declare startedAt: Date;
  declare endedAt?: Date | null;
  declare durationSeconds?: number | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  get _id(): string {
    return this.id;
  }
}

Match.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    lobbyId: {
      type: DataTypes.STRING(100),
      allowNull: true,
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
    status: {
      type: DataTypes.ENUM('in_progress', 'completed', 'abandoned', 'cancelled'),
      allowNull: false,
      defaultValue: 'in_progress',
    },
    players: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
    winnerId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    prizePool: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    entryFee: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    gameState: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {},
    },
    currentTurnUserId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    turnDeadline: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    startedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    endedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    durationSeconds: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'matches',
    indexes: [
      {
        fields: ['gameId'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['startedAt'],
      },
    ],
  }
);

export type IMatchDocument = Match;
