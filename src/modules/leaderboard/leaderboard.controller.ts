import { Request, Response } from 'express';
import { LeaderboardService } from './leaderboard.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { HTTP_STATUS } from '../../constants/http.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export class LeaderboardController {
  static getGlobal = asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string, 10) || 50;
    const leaderboard = await LeaderboardService.getGlobalLeaderboard(limit);
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, leaderboard, 'Global leaderboard retrieved'));
  });

  static getByGame = asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string, 10) || 50;
    const leaderboard = await LeaderboardService.getGameLeaderboard(req.params.gameId as any, limit);
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, leaderboard, 'Game leaderboard retrieved'));
  });

  static getFriends = asyncHandler(async (req: Request, res: Response) => {
    const leaderboard = await LeaderboardService.getFriendsLeaderboard(req.user!.userId);
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, leaderboard, 'Friends leaderboard retrieved'));
  });
}
