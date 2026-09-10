import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../../config/database.js';

export type TransactionType =
  | 'daily_reward'
  | 'match_win'
  | 'match_entry'
  | 'referral_bonus'
  | 'level_up'
  | 'purchase'
  | 'spin_wheel';

export interface ITransactionAttributes {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  currency: 'coins' | 'diamonds';
  balanceAfter: number;
  description: string;
  referenceId?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ITransactionCreationAttributes
  extends Optional<ITransactionAttributes, 'id' | 'currency' | 'referenceId' | 'createdAt' | 'updatedAt'> {}

export class Transaction
  extends Model<ITransactionAttributes, ITransactionCreationAttributes>
  implements ITransactionAttributes
{
  declare id: string;
  declare userId: string;
  declare type: TransactionType;
  declare amount: number;
  declare currency: 'coins' | 'diamonds';
  declare balanceAfter: number;
  declare description: string;
  declare referenceId?: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  get _id(): string {
    return this.id;
  }
}

Transaction.init(
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
    type: {
      type: DataTypes.ENUM(
        'daily_reward',
        'match_win',
        'match_entry',
        'referral_bonus',
        'level_up',
        'purchase',
        'spin_wheel'
      ),
      allowNull: false,
    },
    amount: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    currency: {
      type: DataTypes.ENUM('coins', 'diamonds'),
      allowNull: false,
      defaultValue: 'coins',
    },
    balanceAfter: {
      type: DataTypes.BIGINT,
      allowNull: false,
      get() {
        const rawValue = this.getDataValue('balanceAfter');
        return rawValue !== null && rawValue !== undefined ? Number(rawValue) : 0;
      },
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    referenceId: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'transactions',
    indexes: [
      {
        fields: ['userId'],
      },
      {
        fields: ['createdAt'],
      },
    ],
  }
);

export type ITransactionDocument = Transaction;
