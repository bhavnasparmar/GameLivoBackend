import { ChatMessage, IChatMessageDocument } from './chat.model.js';
import { User } from '../user/user.model.js';

export class ChatService {
  static async saveMessage(data: {
    roomId: string;
    senderId: string;
    message: string;
    type?: 'text' | 'emoji' | 'system';
  }): Promise<IChatMessageDocument> {
    const sender = await User.findByPk(data.senderId);

    const chatMessage = await ChatMessage.create({
      roomId: data.roomId,
      senderId: data.senderId,
      senderName: sender ? sender.username : 'Unknown',
      senderAvatar: sender ? sender.avatar : 'avatar_default_1',
      message: data.message,
      type: data.type || 'text',
    });

    return chatMessage;
  }

  static async getRoomMessages(roomId: string, limit = 50): Promise<IChatMessageDocument[]> {
    const messages = await ChatMessage.findAll({
      where: { roomId },
      order: [['createdAt', 'DESC']],
      limit,
    });
    return messages.reverse();
  }
}
