import { Op } from 'sequelize';
import { FriendRequest, IFriendRequestDocument } from './friends.model.js';
import { User } from '../user/user.model.js';
import { ApiError } from '../../utils/ApiError.js';

export class FriendsService {
  static async sendRequest(senderId: string, receiverId: string): Promise<IFriendRequestDocument> {
    if (senderId === receiverId) {
      throw ApiError.badRequest('You cannot send a friend request to yourself');
    }

    const receiver = await User.findByPk(receiverId);
    if (!receiver) {
      throw ApiError.notFound('Target user not found');
    }

    // Check if already friends
    const sender = await User.findByPk(senderId);
    if (sender?.friends && sender.friends.includes(receiverId)) {
      throw ApiError.badRequest('You are already friends with this user');
    }

    // Check existing pending request
    const existing = await FriendRequest.findOne({
      where: {
        [Op.or]: [
          { senderId, receiverId, status: 'pending' },
          { senderId: receiverId, receiverId: senderId, status: 'pending' },
        ],
      },
    });

    if (existing) {
      throw ApiError.badRequest('A friend request is already pending between both users');
    }

    const request = await FriendRequest.create({
      senderId,
      receiverId,
      status: 'pending',
    });

    return request;
  }

  static async respondToRequest(
    requestId: string,
    userId: string,
    action: 'accept' | 'decline'
  ): Promise<any> {
    const request = await FriendRequest.findByPk(requestId);
    if (!request || request.receiverId !== userId) {
      throw ApiError.notFound('Friend request not found or unauthorized');
    }

    if (request.status !== 'pending') {
      throw ApiError.badRequest(`Request is already ${request.status}`);
    }

    if (action === 'accept') {
      request.status = 'accepted';
      await request.save();

      // Add each other to friends array
      const sender = await User.findByPk(request.senderId);
      const receiver = await User.findByPk(request.receiverId);

      if (sender) {
        const senderFriends = Array.from(new Set([...(sender.friends || []), request.receiverId]));
        await sender.update({ friends: senderFriends });
      }

      if (receiver) {
        const receiverFriends = Array.from(new Set([...(receiver.friends || []), request.senderId]));
        await receiver.update({ friends: receiverFriends });
      }

      return { status: 'accepted', message: 'Friend request accepted' };
    } else {
      request.status = 'declined';
      await request.save();
      return { status: 'declined', message: 'Friend request declined' };
    }
  }

  static async getFriends(userId: string): Promise<any[]> {
    const user = await User.findByPk(userId);
    if (!user || !user.friends || user.friends.length === 0) {
      return [];
    }

    const friends = await User.findAll({
      where: {
        id: {
          [Op.in]: user.friends,
        },
      },
      attributes: ['id', 'username', 'avatar', 'isOnline', 'lastActive', 'level'],
    });

    return friends;
  }

  static async getPendingRequests(userId: string): Promise<any[]> {
    const requests = await FriendRequest.findAll({
      where: {
        receiverId: userId,
        status: 'pending',
      },
    });

    const senderIds = requests.map((r) => r.senderId);
    const senders = await User.findAll({
      where: {
        id: {
          [Op.in]: senderIds,
        },
      },
      attributes: ['id', 'username', 'avatar', 'level'],
    });

    const senderMap = new Map(senders.map((s) => [s.id, s]));

    return requests.map((r) => ({
      requestId: r.id,
      sender: senderMap.get(r.senderId),
      createdAt: r.createdAt,
    }));
  }

  static async removeFriend(userId: string, friendId: string): Promise<void> {
    const user = await User.findByPk(userId);
    const friend = await User.findByPk(friendId);

    if (user) {
      const updated = (user.friends || []).filter((id) => id !== friendId);
      await user.update({ friends: updated });
    }

    if (friend) {
      const updated = (friend.friends || []).filter((id) => id !== userId);
      await friend.update({ friends: updated });
    }
  }

  static async searchUsers(query: string, currentUserId: string): Promise<any[]> {
    if (!query || query.trim().length < 2) return [];
    return await User.findAll({
      where: {
        username: {
          [Op.like]: `%${query.trim()}%`,
        },
        id: {
          [Op.ne]: currentUserId,
        },
      },
      attributes: ['id', 'username', 'avatar', 'level', 'isOnline'],
      limit: 10,
    });
  }
}
