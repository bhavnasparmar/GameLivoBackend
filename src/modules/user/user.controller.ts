import { Request, Response } from 'express';
import { UserService } from './user.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { HTTP_STATUS } from '../../constants/http.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export class UserController {
  static getProfile = asyncHandler(async (req: Request, res: Response) => {
    const user = await UserService.getProfile(req.user!.userId);
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, user, 'Profile retrieved'));
  });

  static updateProfile = asyncHandler(async (req: Request, res: Response) => {
    const updatedUser = await UserService.updateProfile(req.user!.userId, req.body);
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, updatedUser, 'Profile updated'));
  });

  static getStats = asyncHandler(async (req: Request, res: Response) => {
    const stats = await UserService.getUserStats(req.user!.userId);
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, stats, 'User stats retrieved'));
  });
}
