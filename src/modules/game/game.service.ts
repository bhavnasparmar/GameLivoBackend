import { GAMES_CATALOG, GameConfig } from '../../constants/games.js';
import { ApiError } from '../../utils/ApiError.js';

export class GameService {
  static getAllGames(): GameConfig[] {
    return GAMES_CATALOG.filter((g) => g.isActive);
  }

  static getGameById(gameId: string): GameConfig {
    const game = GAMES_CATALOG.find((g) => g.id === gameId);
    if (!game) {
      throw ApiError.notFound(`Game '${gameId}' not found`);
    }
    return game;
  }
}
