import { Notification, INotificationDocument } from './notification.model.js';
import { formatPaginatedResult, getPaginationOptions } from '../../utils/pagination.js';

export class NotificationService {
  static async createNotification(params: {
    userId: string;
    title: string;
    message: string;
    type?: 'system' | 'reward' | 'friend_request' | 'game_invite' | 'match_result';
    data?: Record<string, any>;
  }): Promise<INotificationDocument> {
    return await Notification.create({
      userId: params.userId,
      title: params.title,
      message: params.message,
      type: params.type || 'system',
      data: params.data,
      isRead: false,
    });
  }

  static async getUserNotifications(userId: string, query: any) {
    const { page, limit, sortBy, sortOrder } = getPaginationOptions(query);
    const validSortOrder = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    const { count, rows } = await Notification.findAndCountAll({
      where: { userId },
      order: [[sortBy, validSortOrder]],
      offset: (page - 1) * limit,
      limit,
    });

    return formatPaginatedResult(rows, count, page, limit);
  }

  static async markAsRead(notificationId: string, userId: string): Promise<void> {
    await Notification.update(
      { isRead: true },
      {
        where: { id: notificationId, userId },
      }
    );
  }

  static async markAllAsRead(userId: string): Promise<void> {
    await Notification.update(
      { isRead: true },
      {
        where: { userId, isRead: false },
      }
    );
  }
}
