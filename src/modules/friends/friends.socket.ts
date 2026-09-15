import { Server } from 'socket.io';
import { AuthenticatedSocket } from '../../types/socket.js';
import { SOCKET_EVENTS } from '../../constants/socketEvents.js';
import { NotificationService } from '../notification/notification.service.js';
import { logger } from '../../utils/logger.js';

export function registerFriendsSocketHandlers(io: Server, socket: AuthenticatedSocket): void {
  // Send Game Invite to a Friend with Validation
  socket.on(
    SOCKET_EVENTS.FRIEND_GAME_INVITE,
    async (data: {
      friendUserId: string;
      gameId?: string;
      roomCode?: string;
      lobbyId?: string;
      timeSeconds?: number;
      customMessage?: string;
    }) => {
      try {
        const { friendUserId, gameId = 'chess', roomCode, lobbyId, timeSeconds = 300 } = data;
        const senderUserId = socket.user?.userId;
        const senderUsername = socket.user?.username || 'Your friend';

        // 1. Validation: required fields
        if (!friendUserId || typeof friendUserId !== 'string' || friendUserId.trim() === '') {
          socket.emit(SOCKET_EVENTS.ERROR, { message: 'Invalid friend user ID for invite.' });
          return;
        }

        if (!senderUserId) {
          socket.emit(SOCKET_EVENTS.ERROR, { message: 'Authentication required to send invite.' });
          return;
        }

        // 2. Validation: cannot invite self
        if (friendUserId === senderUserId) {
          socket.emit(SOCKET_EVENTS.ERROR, { message: 'You cannot invite yourself.' });
          return;
        }

        // 3. Validation: valid room code format
        if (roomCode && !/^[A-Za-z0-9]{4,8}$/.test(roomCode)) {
          socket.emit(SOCKET_EVENTS.ERROR, { message: 'Invalid room code format for invite.' });
          return;
        }

        // 4. Validation: timeSeconds
        const validTime = Math.max(30, Math.min(3600, Number(timeSeconds) || 300));

        const invitePayload = {
          fromUserId: senderUserId,
          fromUsername: senderUsername,
          gameId,
          roomCode: roomCode?.toUpperCase(),
          lobbyId,
          timeSeconds: validTime,
          sentAt: new Date().toISOString(),
        };

        // Emit real-time invite event to target friend's personal socket room
        io.to(`user:${friendUserId}`).emit(SOCKET_EVENTS.FRIEND_GAME_INVITE, invitePayload);

        // Persist notification in database
        await NotificationService.createNotification({
          userId: friendUserId,
          title: `🎮 ${gameId.toUpperCase()} Match Invite!`,
          message: `${senderUsername} invited you to play a ${Math.round(validTime / 60)}m ${gameId} match (Room #${roomCode || 'Private'}).`,
          type: 'game_invite',
          data: invitePayload,
        }).catch((err) => logger.warn('[FriendsSocket] Notification create warning:', err));

        logger.info(`[FriendsSocket] User ${senderUsername} sent ${gameId} invite to ${friendUserId} (Room #${roomCode})`);
      } catch (err) {
        logger.error('[FriendsSocket] FRIEND_GAME_INVITE error:', err);
      }
    }
  );

  // Friend responds to game invite (Accept / Decline) with Validation
  socket.on(
    SOCKET_EVENTS.FRIEND_INVITE_RESPONSE,
    async (data: {
      hostUserId: string;
      roomCode?: string;
      lobbyId?: string;
      accepted: boolean;
      gameId?: string;
    }) => {
      try {
        const { hostUserId, roomCode, lobbyId, accepted, gameId = 'chess' } = data;
        const responderUserId = socket.user?.userId;
        const responderUsername = socket.user?.username || 'Friend';

        if (!hostUserId || typeof hostUserId !== 'string') {
          return;
        }

        const responsePayload = {
          friendUserId: responderUserId,
          friendUsername: responderUsername,
          roomCode: roomCode?.toUpperCase(),
          lobbyId,
          accepted: Boolean(accepted),
          gameId,
        };

        // Notify host about the friend's response
        io.to(`user:${hostUserId}`).emit(SOCKET_EVENTS.FRIEND_INVITE_RESPONSE, responsePayload);

        logger.info(`[FriendsSocket] User ${responderUsername} responded to invite from ${hostUserId}: ${accepted ? 'ACCEPTED' : 'DECLINED'}`);
      } catch (err) {
        logger.error('[FriendsSocket] FRIEND_INVITE_RESPONSE error:', err);
      }
    }
  );
}
