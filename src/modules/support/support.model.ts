import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../../config/database.js';

export type TicketCategory = 'gameplay' | 'account' | 'payment' | 'bug' | 'other';
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high';

export interface ITicketAttributes {
  id: string;
  userId: string;
  category: TicketCategory;
  subject: string;
  message: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ITicketCreationAttributes
  extends Optional<ITicketAttributes, 'id' | 'category' | 'status' | 'priority' | 'createdAt' | 'updatedAt'> {}

export class SupportTicket
  extends Model<ITicketAttributes, ITicketCreationAttributes>
  implements ITicketAttributes
{
  declare id: string;
  declare userId: string;
  declare category: TicketCategory;
  declare subject: string;
  declare message: string;
  declare status: TicketStatus;
  declare priority: TicketPriority;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  get _id(): string {
    return this.id;
  }
}

SupportTicket.init(
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
    category: {
      type: DataTypes.ENUM('gameplay', 'account', 'payment', 'bug', 'other'),
      allowNull: false,
      defaultValue: 'other',
    },
    subject: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('open', 'in_progress', 'resolved', 'closed'),
      allowNull: false,
      defaultValue: 'open',
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high'),
      allowNull: false,
      defaultValue: 'medium',
    },
  },
  {
    sequelize,
    tableName: 'support_tickets',
    indexes: [
      {
        fields: ['userId'],
      },
      {
        fields: ['status'],
      },
    ],
  }
);

export type ReportReason = 'cheating' | 'abusive_chat' | 'afk' | 'inappropriate_name' | 'other';
export type ReportStatus = 'pending' | 'reviewed' | 'action_taken' | 'dismissed';

export interface IReportAttributes {
  id: string;
  reporterId: string;
  reportedUserId: string;
  matchId?: string | null;
  reason: ReportReason;
  description?: string | null;
  status: ReportStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IReportCreationAttributes
  extends Optional<IReportAttributes, 'id' | 'matchId' | 'description' | 'status' | 'createdAt' | 'updatedAt'> {}

export class PlayerReport
  extends Model<IReportAttributes, IReportCreationAttributes>
  implements IReportAttributes
{
  declare id: string;
  declare reporterId: string;
  declare reportedUserId: string;
  declare matchId?: string | null;
  declare reason: ReportReason;
  declare description?: string | null;
  declare status: ReportStatus;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  get _id(): string {
    return this.id;
  }
}

PlayerReport.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    reporterId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    reportedUserId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    matchId: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    reason: {
      type: DataTypes.ENUM('cheating', 'abusive_chat', 'afk', 'inappropriate_name', 'other'),
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('pending', 'reviewed', 'action_taken', 'dismissed'),
      allowNull: false,
      defaultValue: 'pending',
    },
  },
  {
    sequelize,
    tableName: 'player_reports',
    indexes: [
      {
        fields: ['reporterId'],
      },
      {
        fields: ['reportedUserId'],
      },
      {
        fields: ['status'],
      },
    ],
  }
);

export type ITicketDocument = SupportTicket;
export type IReportDocument = PlayerReport;
