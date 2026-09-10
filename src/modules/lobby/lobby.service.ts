import { Op } from 'sequelize';
import { Lobby, ILobbyDocument, ILobbyPlayer } from './lobby.model.js';
import { User } from '../user/user.model.js';
import { ApiError } from '../../utils/ApiError.js';

export class LobbyService {
  private static generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  static async createLobby(
    userId: string,
    data: {
      gameId: string;
      mode?: string;
      maxPlayers?: number;
      entryFee?: number;
      isPrivate?: boolean;
    }
  ): Promise<ILobbyDocument> {
    const user = await User.findByPk(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    const entryFee = data.entryFee || 0;
    if (entryFee > 0 && user.coins < entryFee) {
      throw ApiError.badRequest('Insufficient coins for this entry fee');
    }

    let code = this.generateRoomCode();
    // Ensure code uniqueness
    let attempts = 0;
    while (
      await Lobby.findOne({
        where: {
          code,
          status: { [Op.in]: ['waiting', 'starting'] },
        },
      })
    ) {
      code = this.generateRoomCode();
      attempts++;
      if (attempts > 5) break;
    }

    const hostPlayer: ILobbyPlayer = {
      userId: user.id,
      username: user.username,
      avatar: user.avatar,
      seatIndex: 0,
      isReady: true,
      isHost: true,
      joinedAt: new Date(),
    };

    const lobby = await Lobby.create({
      code,
      gameId: data.gameId,
      mode: data.mode || 'classic',
      hostId: user.id,
      maxPlayers: data.maxPlayers || 4,
      minPlayers: 2,
      entryFee,
      prizePool: Math.floor(entryFee * (data.maxPlayers || 4) * 0.9), // 10% platform commission
      isPrivate: data.isPrivate ?? false,
      status: 'waiting',
      players: [hostPlayer],
    });

    return lobby;
  }

  static async joinLobby(code: string, userId: string): Promise<ILobbyDocument> {
    const lobby = await Lobby.findOne({
      where: {
        code: code.toUpperCase(),
        status: 'waiting',
      },
    });
    if (!lobby) {
      throw ApiError.notFound('Lobby not found or already started');
    }

    const user = await User.findByPk(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    if (lobby.entryFee > 0 && user.coins < lobby.entryFee) {
      throw ApiError.badRequest('Insufficient coins for entry fee');
    }

    const existingPlayer = (lobby.players || []).find((p) => p.userId === userId);
    if (existingPlayer) {
      return lobby; // Already in lobby
    }

    if ((lobby.players || []).length >= lobby.maxPlayers) {
      throw ApiError.badRequest('Lobby is full');
    }

    // Assign next available seat
    const takenSeats = new Set((lobby.players || []).map((p) => p.seatIndex));
    let seatIndex = 0;
    while (takenSeats.has(seatIndex)) {
      seatIndex++;
    }

    const newPlayer: ILobbyPlayer = {
      userId: user.id,
      username: user.username,
      avatar: user.avatar,
      seatIndex,
      isReady: false,
      isHost: false,
      joinedAt: new Date(),
    };

    const updatedPlayers = [...(lobby.players || []), newPlayer];
    lobby.players = updatedPlayers;
    await lobby.save();

    return lobby;
  }

  static async leaveLobby(lobbyId: string, userId: string): Promise<{ closed: boolean; lobby?: ILobbyDocument }> {
    const lobby = await Lobby.findByPk(lobbyId);
    if (!lobby) return { closed: true };

    const remainingPlayers = (lobby.players || []).filter((p) => p.userId !== userId);
    lobby.players = remainingPlayers;

    if (remainingPlayers.length === 0 || lobby.hostId === userId) {
      lobby.status = 'closed';
      await lobby.save();
      return { closed: true };
    }

    await lobby.save();
    return { closed: false, lobby };
  }

  static async getPublicLobbies(gameId?: string): Promise<ILobbyDocument[]> {
    const whereClause: any = {
      status: 'waiting',
      isPrivate: false,
    };
    if (gameId) {
      whereClause.gameId = gameId;
    }

    return await Lobby.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: 20,
    });
  }

  static async getLobbyById(lobbyId: string): Promise<ILobbyDocument> {
    const lobby = await Lobby.findByPk(lobbyId);
    if (!lobby) {
      throw ApiError.notFound('Lobby not found');
    }
    return lobby;
  }
}
