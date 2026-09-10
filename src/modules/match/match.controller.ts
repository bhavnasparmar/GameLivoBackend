import { Request, Response } from 'express';
import { MatchService } from './match.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { HTTP_STATUS } from '../../constants/http.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export class MatchController {
  static getById = asyncHandler(async (req: Request, res: Response) => {
    const match = await MatchService.getMatchById(req.params.matchId as any);
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, match, 'Match details retrieved'));
  });

  static getHistory = asyncHandler(async (req: Request, res: Response) => {
    const history = await MatchService.getUserMatchHistory(req.user!.userId, req.query);
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, history, 'Match history retrieved'));
  });
}
