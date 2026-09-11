import { Op } from 'sequelize';
import { FriendRequest, IFriendRequestDocument } from './friends.model.js';
import { User } from '../user/user.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { NotificationService } from '../notification/notification.service.js';

function getFriendsArray(user: User | null): string[] {
  if (!user || !user.friends) return [];
  if (typeof user.friends === 'string') {
    try {
      const parsed = JSON.parse(user.friends);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return Array.isArray(user.friends) ? user.friends : [];
}

async function getAllFriendIds(userId: string): Promise<string[]> {
  const user = await User.findByPk(userId);
  const friendIdsFromUser = getFriendsArray(user);

  const acceptedRequests = await FriendRequest.findAll({
    where: {
      [Op.or]: [
        { senderId: userId, status: 'accepted' },
        { receiverId: userId, status: 'accepted' },
      ],
    },
  });

  const friendIdsFromRequests = acceptedRequests.map((r) =>
    r.senderId === userId ? r.receiverId : r.senderId
  );

  const allIds = Array.from(new Set([...friendIdsFromUser, ...friendIdsFromRequests])).filter(
    (id) => id && id !== userId
  );

  // Sync back to user model if there was a discrepancy
  if (user && allIds.length !== friendIdsFromUser.length) {
    user.friends = allIds;
    user.changed('friends', true);
    await user.save().catch(() => {});
  }

  return allIds;
}

export class FriendsService {
  static async sendRequest(senderId: string, receiverId: string): Promise<IFriendRequestDocument> {
    if (!receiverId || typeof receiverId !== 'string') {
      throw ApiError.badRequest('Valid receiver ID is required');
    }

    if (senderId === receiverId) {
      throw ApiError.badRequest('You cannot send a friend request to yourself');
    }

    const receiver = await User.findByPk(receiverId);
    if (!receiver) {
      throw ApiError.notFound('Target user not found');
    }

    const sender = await User.findByPk(senderId);
    if (!sender) {
      throw ApiError.notFound('Sender user not found');
    }

    // Check if already friends
    const allFriendIds = await getAllFriendIds(senderId);
    if (allFriendIds.includes(receiverId)) {
      throw ApiError.badRequest('You are already friends with this user');
    }

    // Check if the other user has already sent a pending request to sender
    const incomingPending = await FriendRequest.findOne({
      where: {
        senderId: receiverId,
        receiverId: senderId,
        status: 'pending',
      },
    });

    if (incomingPending) {
      // Auto-accept request since both users intend to connect
      incomingPending.status = 'accepted';
      await incomingPending.save();

      const senderFriends = getFriendsArray(sender);
      const updatedSenderFriends = Array.from(new Set([...senderFriends, receiverId]));
      sender.friends = updatedSenderFriends;
      sender.changed('friends', true);
      await sender.save();

      const receiverFriends = getFriendsArray(receiver);
      const updatedReceiverFriends = Array.from(new Set([...receiverFriends, senderId]));
      receiver.friends = updatedReceiverFriends;
      receiver.changed('friends', true);
      await receiver.save();

      await NotificationService.createNotification({
        userId: receiver.id,
        title: 'Friend Request Accepted',
        message: `${sender.username} accepted your friend request.`,
        type: 'friend_request',
        data: { friendId: sender.id },
      }).catch(() => {});

      return incomingPending;
    }

    // Check if sender has already sent a pending request to receiver
    const outgoingPending = await FriendRequest.findOne({
      where: {
        senderId,
        receiverId,
        status: 'pending',
      },
    });

    if (outgoingPending) {
      throw ApiError.badRequest('A friend request has already been sent to this user');
    }

    // Remove any stale non-pending requests between these two users
    await FriendRequest.destroy({
      where: {
        [Op.or]: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId },
        ],
        status: {
          [Op.ne]: 'pending',
        },
      },
    }).catch(() => {});

    // Create fresh pending friend request
    const request = await FriendRequest.create({
      senderId,
      receiverId,
      status: 'pending',
    });

    // Notify receiver
    await NotificationService.createNotification({
      userId: receiverId,
      title: 'New Friend Request',
      message: `${sender.username} sent you a friend request.`,
      type: 'friend_request',
      data: { senderId, requestId: request.id },
    }).catch(() => {});

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
        const sFriends = getFriendsArray(sender);
        sender.friends = Array.from(new Set([...sFriends, request.receiverId]));
        sender.changed('friends', true);
        await sender.save();

        await NotificationService.createNotification({
          userId: sender.id,
          title: 'Friend Request Accepted',
          message: `${receiver?.username || 'A player'} accepted your friend request.`,
          type: 'friend_request',
          data: { friendId: receiver?.id },
        }).catch(() => {});
      }

      if (receiver) {
        const rFriends = getFriendsArray(receiver);
        receiver.friends = Array.from(new Set([...rFriends, request.senderId]));
        receiver.changed('friends', true);
        await receiver.save();
      }

      return { status: 'accepted', message: 'Friend request accepted' };
    } else {
      request.status = 'declined';
      await request.save();
      return { status: 'declined', message: 'Friend request declined' };
    }
  }

  static async getFriends(userId: string): Promise<any[]> {
    const friendIds = await getAllFriendIds(userId);
    if (friendIds.length === 0) {
      return [];
    }

    const friends = await User.findAll({
      where: {
        id: {
          [Op.in]: friendIds,
        },
      },
      attributes: ['id', 'username', 'avatar', 'isOnline', 'lastActive', 'level'],
    });

    return friends.map((f) => ({
      id: f.id,
      name: f.username,
      username: f.username,
      avatar: f.avatar,
      isOnline: Boolean(f.isOnline),
      lastSeen: f.lastActive ? new Date(f.lastActive).toLocaleDateString() : 'recently',
      level: f.level || 1,
      rank: 1,
      currentActivity: f.isOnline ? 'Online' : 'Offline',
    }));
  }

  static async getPendingRequests(userId: string): Promise<any[]> {
    const requests = await FriendRequest.findAll({
      where: {
        receiverId: userId,
        status: 'pending',
      },
      order: [['createdAt', 'DESC']],
    });

    if (requests.length === 0) {
      return [];
    }

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

    return requests.map((r) => {
      const sender = senderMap.get(r.senderId);
      return {
        id: r.id,
        requestId: r.id,
        name: sender?.username || 'Player',
        username: sender?.username || 'player',
        avatar: sender?.avatar || '',
        level: sender?.level || 1,
        direction: 'incoming',
        sentAt: r.createdAt,
      };
    });
  }

  static async removeFriend(userId: string, friendId: string): Promise<void> {
    const user = await User.findByPk(userId);
    const friend = await User.findByPk(friendId);

    if (user) {
      const updated = getFriendsArray(user).filter((id) => id !== friendId);
      user.friends = updated;
      user.changed('friends', true);
      await user.save();
    }

    if (friend) {
      const updated = getFriendsArray(friend).filter((id) => id !== userId);
      friend.friends = updated;
      friend.changed('friends', true);
      await friend.save();
    }

    // Clean up any friend requests between the two users
    await FriendRequest.destroy({
      where: {
        [Op.or]: [
          { senderId: userId, receiverId: friendId },
          { senderId: friendId, receiverId: userId },
        ],
      },
    }).catch(() => {});
  }

  static async getSuggestions(currentUserId: string): Promise<any[]> {
    const friendIds = await getAllFriendIds(currentUserId);
    const excludedIds = [currentUserId, ...friendIds];

    const pendingRequests = await FriendRequest.findAll({
      where: {
        [Op.or]: [
          { senderId: currentUserId, status: 'pending' },
          { receiverId: currentUserId, status: 'pending' },
        ],
      },
    });

    const pendingUserIds = new Set(
      pendingRequests.map((r) => (r.senderId === currentUserId ? r.receiverId : r.senderId))
    );

    // Fetch all users who are NOT the current user AND NOT already friends
    const users = await User.findAll({
      where: {
        id: {
          [Op.notIn]: excludedIds,
        },
      },
      attributes: ['id', 'username', 'avatar', 'level', 'isOnline', 'lastActive'],
      order: [['createdAt', 'DESC']],
      limit: 50,
    });

    return users.map((u) => ({
      id: u.id,
      username: u.username,
      name: u.username,
      avatar: u.avatar,
      level: u.level || 1,
      isOnline: Boolean(u.isOnline),
      lastSeen: u.lastActive,
      isFriend: false,
      hasPendingRequest: pendingUserIds.has(u.id),
    }));
  }

  static async searchUsers(query: string, currentUserId: string): Promise<any[]> {
    if (!query || query.trim().length < 1) return [];
    const friendIds = await getAllFriendIds(currentUserId);
    const friendIdSet = new Set(friendIds);

    const pendingRequests = await FriendRequest.findAll({
      where: {
        [Op.or]: [
          { senderId: currentUserId, status: 'pending' },
          { receiverId: currentUserId, status: 'pending' },
        ],
      },
    });

    const pendingUserIds = new Set(
      pendingRequests.map((r) => (r.senderId === currentUserId ? r.receiverId : r.senderId))
    );

    const users = await User.findAll({
      where: {
        username: {
          [Op.like]: `%${query.trim()}%`,
        },
        id: {
          [Op.ne]: currentUserId,
        },
      },
      attributes: ['id', 'username', 'avatar', 'level', 'isOnline'],
      limit: 20,
    });

    return users.map((u) => ({
      id: u.id,
      username: u.username,
      name: u.username,
      avatar: u.avatar,
      level: u.level || 1,
      isOnline: Boolean(u.isOnline),
      isFriend: friendIdSet.has(u.id),
      hasPendingRequest: pendingUserIds.has(u.id),
    }));
  }
}
