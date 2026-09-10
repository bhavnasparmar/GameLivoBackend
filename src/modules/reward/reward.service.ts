import { Transaction } from './reward.model.js';
import { User } from '../user/user.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { cache } from '../../config/redis.js';
import { formatPaginatedResult, getPaginationOptions } from '../../utils/pagination.js';

export class RewardService {
  static DAILY_REWARDS = [100, 200, 350, 500, 750, 1000, 2000];

  static async getDailyRewardStatus(userId: string): Promise<{
    canClaim: boolean;
    streak: number;
    rewards: number[];
    nextRewardAmount: number;
  }> {
    const key = `daily_reward:${userId}`;
    const lastClaim = await cache.get(key);

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const canClaim = lastClaim !== todayStr;
    const streak = 1; // can be enhanced with persistent streak tracking

    return {
      canClaim,
      streak,
      rewards: this.DAILY_REWARDS,
      nextRewardAmount: this.DAILY_REWARDS[0],
    };
  }

  static async claimDailyReward(userId: string): Promise<{ coinsEarned: number; newBalance: number }> {
    const status = await this.getDailyRewardStatus(userId);
    if (!status.canClaim) {
      throw ApiError.badRequest('Daily reward already claimed today. Come back tomorrow!');
    }

    const rewardAmount = status.nextRewardAmount;
    const user = await User.findByPk(userId);

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    await user.increment('coins', { by: rewardAmount });
    await user.reload();

    const todayStr = new Date().toISOString().split('T')[0];
    await cache.set(`daily_reward:${userId}`, todayStr, 24 * 60 * 60);

    await Transaction.create({
      userId,
      type: 'daily_reward',
      amount: rewardAmount,
      currency: 'coins',
      balanceAfter: user.coins,
      description: `Daily check-in reward Day ${status.streak}`,
    });

    return { coinsEarned: rewardAmount, newBalance: user.coins };
  }

  static async getReferralInfo(userId: string): Promise<any> {
    const user = await User.findByPk(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    const totalReferred = await User.count({ where: { referredBy: user.referralCode } });
    const rewardPerReferral = 250;

    return {
      referralCode: user.referralCode,
      totalReferred,
      totalEarned: totalReferred * rewardPerReferral,
      rewardPerReferral,
      shareLink: `https://gamelivo.com/invite?code=${user.referralCode}`,
    };
  }

  static async getUserTransactions(userId: string, query: any) {
    const { page, limit, sortBy, sortOrder } = getPaginationOptions(query);
    const validSortOrder = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    const { count, rows } = await Transaction.findAndCountAll({
      where: { userId },
      order: [[sortBy, validSortOrder]],
      offset: (page - 1) * limit,
      limit,
    });

    return formatPaginatedResult(rows, count, page, limit);
  }
}
