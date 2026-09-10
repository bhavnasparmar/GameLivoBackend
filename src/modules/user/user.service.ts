import { Op } from 'sequelize';
import { User, IUserDocument } from './user.model.js';
import { ApiError } from '../../utils/ApiError.js';

export class UserService {
  static async getProfile(userId: string): Promise<IUserDocument> {
    const user = await User.findByPk(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }
    return user;
  }

  static async updateProfile(userId: string, data: any): Promise<IUserDocument> {
    const user = await User.findByPk(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    if (data.username) {
      const existing = await User.findOne({
        where: {
          username: data.username,
          id: { [Op.ne]: userId },
        },
      });
      if (existing) {
        throw ApiError.conflict('Username is already taken');
      }
    }

    if (data.email) {
      const existing = await User.findOne({
        where: {
          email: data.email,
          id: { [Op.ne]: userId },
        },
      });
      if (existing) {
        throw ApiError.conflict('Email is already registered');
      }
    }

    await user.update(data);
    return user;
  }

  static async getUserStats(userId: string): Promise<any> {
    const user = await User.findByPk(userId, {
      attributes: ['gameStats', 'level', 'xp', 'coins', 'diamonds'],
    });
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    let totalPlayed = 0;
    let totalWon = 0;

    const gameStats = user.gameStats || {};
    Object.values(gameStats).forEach((stat: any) => {
      totalPlayed += stat?.played || 0;
      totalWon += stat?.won || 0;
    });

    const winRate = totalPlayed > 0 ? Math.round((totalWon / totalPlayed) * 100) : 0;

    return {
      level: user.level,
      xp: user.xp,
      coins: user.coins,
      diamonds: user.diamonds,
      totalPlayed,
      totalWon,
      winRate,
      gameStats: user.gameStats,
    };
  }

  static async addCoins(userId: string, amount: number): Promise<number> {
    const user = await User.findByPk(userId);
    if (!user) return 0;
    await user.increment('coins', { by: amount });
    await user.reload();
    return user.coins;
  }
}
