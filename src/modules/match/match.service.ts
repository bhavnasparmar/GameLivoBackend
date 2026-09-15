import { Op, Sequelize } from 'sequelize';
import { Match, IMatchDocument } from './match.model.js';
import { User } from '../user/user.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { formatPaginatedResult, getPaginationOptions } from '../../utils/pagination.js';

export class MatchService {
  static async createMatchFromLobby(lobby: any): Promise<IMatchDocument> {
    const players = lobby.players.map((p: any) => ({
      userId: p.userId,
      username: p.username,
      avatar: p.avatar,
      seatIndex: p.seatIndex,
      score: 0,
      rank: 0,
      coinsWon: 0,
      isDisconnected: false,
    }));

    // Deduct entry fee from each player
    if (lobby.entryFee > 0) {
      for (const p of players) {
        const user = await User.findByPk(p.userId);
        if (user) {
          await user.decrement('coins', { by: lobby.entryFee });
        }
      }
    }

    const match = await Match.create({
      lobbyId: lobby.id,
      gameId: lobby.gameId,
      mode: lobby.mode,
      status: 'in_progress',
      players,
      prizePool: lobby.prizePool,
      entryFee: lobby.entryFee,
      currentTurnUserId: players[0]?.userId,
      gameState: this.getInitialGameState(lobby.gameId, players),
      startedAt: new Date(),
    });

    return match;
  }

  static async createMatchFromQueue(
    gameId: string,
    queuePlayers: Array<{ userId: string; username: string; avatar: string; rating?: number }>,
    timeSeconds = 300,
    entryFee = 0
  ): Promise<IMatchDocument> {
    const players = queuePlayers.map((p, idx) => ({
      userId: p.userId,
      username: p.username || `Player ${idx + 1}`,
      avatar: p.avatar || '',
      seatIndex: idx,
      score: 0,
      rank: 0,
      coinsWon: 0,
      isDisconnected: false,
      rating: p.rating || 1400,
    }));

    // Deduct entry fee if any
    if (entryFee > 0) {
      for (const p of players) {
        const user = await User.findByPk(p.userId);
        if (user) {
          await user.decrement('coins', { by: entryFee });
        }
      }
    }

    const prizePool = Math.floor(entryFee * players.length * 0.9);

    const match = await Match.create({
      lobbyId: null,
      gameId,
      mode: 'quick_match',
      status: 'in_progress',
      players,
      prizePool,
      entryFee,
      currentTurnUserId: players[0]?.userId,
      gameState: this.getInitialGameState(gameId, players, timeSeconds),
      startedAt: new Date(),
    });

    return match;
  }

  static getInitialGameState(gameId: string, players: any[], timeSeconds = 300): Record<string, any> {
    switch (gameId) {
      case 'ludo':
        return {
          currentDice: null,
          canRoll: true,
          tokens: players.reduce((acc, p) => {
            acc[p.userId] = [-1, -1, -1, -1]; // 4 tokens in base
            return acc;
          }, {} as Record<string, number[]>),
          colors: ['red', 'green', 'yellow', 'blue'].slice(0, players.length),
        };
      case 'chess':
        return {
          fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
          history: [],
          turn: 'white',
          whitePlayerId: players[0]?.userId,
          blackPlayerId: players[1]?.userId,
          whiteTimeLeft: timeSeconds,
          blackTimeLeft: timeSeconds,
          timeSeconds,
          isCheck: false,
          isCheckmate: false,
          isDraw: false,
        };
      case 'uno':
        return {
          topCard: { color: 'red', value: '7' },
          currentColor: 'red',
          direction: 1,
          deckCount: 80,
          playerCardCounts: players.reduce((acc, p) => {
            acc[p.userId] = 7;
            return acc;
          }, {} as Record<string, number>),
        };
      case 'snakes_and_ladders':
        return {
          positions: players.reduce((acc, p) => {
            acc[p.userId] = 0;
            return acc;
          }, {} as Record<string, number>),
          lastDice: null,
        };
      case 'chidiya_udd':
        return {
          currentWord: 'Sparrow (Chidiya)',
          isFlying: true,
          round: 1,
          roundTimeLimitMs: 2500,
        };
      case 'esto':
        return {
          cowrieValues: [1, 0, 1, 0], // shells
          positions: players.reduce((acc, p) => {
            acc[p.userId] = [0, 0, 0, 0];
            return acc;
          }, {} as Record<string, number[]>),
        };
      default:
        return {};
    }
  }

  static async endMatch(
    matchId: string,
    winnerId?: string | null,
    scores?: Record<string, number>
  ): Promise<IMatchDocument> {
    const match = await Match.findByPk(matchId);
    if (!match || match.status === 'completed') {
      throw ApiError.notFound('Match not found or already ended');
    }

    const isDraw = !winnerId || winnerId === 'draw';

    match.status = 'completed';
    match.winnerId = isDraw ? null : winnerId;
    match.endedAt = new Date();
    match.durationSeconds = Math.round(
      (match.endedAt.getTime() - match.startedAt.getTime()) / 1000
    );

    const updatedPlayers = (match.players || []).map((p) => {
      const isWinner = !isDraw && p.userId === winnerId;
      return {
        ...p,
        coinsWon: isWinner ? match.prizePool : isDraw && match.prizePool > 0 ? Math.floor(match.prizePool / 2) : 0,
        rank: isWinner ? 1 : isDraw ? 1 : 2,
        score: scores?.[p.userId] ?? p.score,
      };
    });
    match.players = updatedPlayers;

    // Distribute prize
    if (match.prizePool > 0) {
      if (isDraw) {
        const halfPrize = Math.floor(match.prizePool / 2);
        for (const p of updatedPlayers) {
          const u = await User.findByPk(p.userId);
          if (u) await u.increment({ coins: halfPrize, xp: 30 });
        }
      } else if (winnerId) {
        const winner = await User.findByPk(winnerId);
        if (winner) {
          await winner.increment({ coins: match.prizePool, xp: 50 });
        }
      }
    }

    // Update player gameStats
    for (const p of updatedPlayers) {
      const user = await User.findByPk(p.userId);
      if (user) {
        const isWinner = !isDraw && p.userId === winnerId;
        const currentStats = { ...(user.gameStats || {}) };
        const gameStat = { ...(currentStats[match.gameId] || {
          played: 0,
          won: 0,
          lost: 0,
          draw: 0,
          winStreak: 0,
          highScore: 0,
        }) };

        gameStat.played = (gameStat.played || 0) + 1;
        if (isDraw) {
          gameStat.draw = (gameStat.draw || 0) + 1;
        } else if (isWinner) {
          gameStat.won = (gameStat.won || 0) + 1;
          gameStat.winStreak = (gameStat.winStreak || 0) + 1;
        } else {
          gameStat.lost = (gameStat.lost || 0) + 1;
          gameStat.winStreak = 0;
        }
        currentStats[match.gameId] = gameStat;

        await user.increment('xp', { by: isWinner ? 100 : isDraw ? 40 : 20 });
        await user.update({ gameStats: currentStats });
      }
    }

    await match.save();
    return match;
  }

  static async getMatchById(matchId: string): Promise<IMatchDocument> {
    const match = await Match.findByPk(matchId);
    if (!match) {
      throw ApiError.notFound('Match not found');
    }
    return match;
  }

  static async getUserMatchHistory(userId: string, query: any) {
    const { page, limit, sortBy, sortOrder } = getPaginationOptions(query);
    const validSortOrder = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    const { count, rows } = await Match.findAndCountAll({
      where: {
        status: 'completed',
        [Op.and]: [
          Sequelize.literal(`JSON_SEARCH(players, 'one', '${userId}') IS NOT NULL`),
        ],
      },
      order: [[sortBy, validSortOrder]],
      offset: (page - 1) * limit,
      limit,
    });

    return formatPaginatedResult(rows, count, page, limit);
  }
}
