import { Op, Sequelize } from 'sequelize';
import { User } from '../user/user.model.js';

export class LeaderboardService {
  static async getGlobalLeaderboard(limit = 50): Promise<any[]> {
    const users = await User.findAll({
      order: [
        ['coins', 'DESC'],
        ['xp', 'DESC'],
      ],
      limit,
      attributes: ['id', 'username', 'avatar', 'level', 'coins', 'xp'],
    });

    return users.map((u, index) => ({
      rank: index + 1,
      userId: u.id,
      username: u.username,
      avatar: u.avatar,
      level: u.level,
      coins: u.coins,
      xp: u.xp,
    }));
  }

  static async getGameLeaderboard(gameId: string, limit = 50): Promise<any[]> {
    const users = await User.findAll({
      where: Sequelize.literal(`CAST(COALESCE(JSON_UNQUOTE(JSON_EXTRACT(gameStats, '$.${gameId}.won')), '0') AS UNSIGNED) > 0`),
      order: [
        [
          Sequelize.literal(`CAST(COALESCE(JSON_UNQUOTE(JSON_EXTRACT(gameStats, '$.${gameId}.won')), '0') AS UNSIGNED)`),
          'DESC',
        ],
      ],
      limit,
      attributes: ['id', 'username', 'avatar', 'level', 'gameStats'],
    });

    return users.map((u, index) => {
      const stats = u.gameStats?.[gameId];
      return {
        rank: index + 1,
        userId: u.id,
        username: u.username,
        avatar: u.avatar,
        level: u.level,
        wins: stats?.won || 0,
        played: stats?.played || 0,
        winStreak: stats?.winStreak || 0,
      };
    });
  }

  static async getFriendsLeaderboard(userId: string): Promise<any[]> {
    const user = await User.findByPk(userId);
    if (!user) return [];

    const friendIds = [...(user.friends || []), user.id];
    const users = await User.findAll({
      where: {
        id: {
          [Op.in]: friendIds,
        },
      },
      order: [['coins', 'DESC']],
      attributes: ['id', 'username', 'avatar', 'level', 'coins', 'xp'],
    });

    return users.map((u, index) => ({
      rank: index + 1,
      userId: u.id,
      username: u.username,
      avatar: u.avatar,
      level: u.level,
      coins: u.coins,
      isCurrentUser: u.id === userId,
    }));
  }
}
