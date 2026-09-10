import { Request, Response } from 'express';
import { GameService } from './game.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { HTTP_STATUS } from '../../constants/http.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export class GameController {
  static getAllGames = asyncHandler(async (_req: Request, res: Response) => {
    const games = GameService.getAllGames();
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, games, 'Games fetched successfully'));
  });

  static getGameById = asyncHandler(async (req: Request, res: Response) => {
    const game = GameService.getGameById(req.params.gameId as any);
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, game, 'Game details fetched'));
  });
}
