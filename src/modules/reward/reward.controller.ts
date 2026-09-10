import { Request, Response } from 'express';
import { RewardService } from './reward.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { HTTP_STATUS } from '../../constants/http.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export class RewardController {
  static getDailyStatus = asyncHandler(async (req: Request, res: Response) => {
    const status = await RewardService.getDailyRewardStatus(req.user!.userId);
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, status, 'Daily reward status retrieved'));
  });

  static claimDaily = asyncHandler(async (req: Request, res: Response) => {
    const result = await RewardService.claimDailyReward(req.user!.userId);
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, result, 'Daily reward claimed!'));
  });

  static getReferral = asyncHandler(async (req: Request, res: Response) => {
    const referral = await RewardService.getReferralInfo(req.user!.userId);
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, referral, 'Referral info retrieved'));
  });

  static getTransactions = asyncHandler(async (req: Request, res: Response) => {
    const history = await RewardService.getUserTransactions(req.user!.userId, req.query);
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, history, 'Transactions retrieved'));
  });
}
