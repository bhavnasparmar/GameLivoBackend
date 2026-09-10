import { Request, Response } from 'express';
import { NotificationService } from './notification.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { HTTP_STATUS } from '../../constants/http.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export class NotificationController {
  static getNotifications = asyncHandler(async (req: Request, res: Response) => {
    const notifications = await NotificationService.getUserNotifications(req.user!.userId, req.query);
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, notifications, 'Notifications retrieved'));
  });

  static markRead = asyncHandler(async (req: Request, res: Response) => {
    await NotificationService.markAsRead(req.params.id as any, req.user!.userId);
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, null, 'Notification marked as read'));
  });

  static markAllRead = asyncHandler(async (req: Request, res: Response) => {
    await NotificationService.markAllAsRead(req.user!.userId);
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, null, 'All notifications marked as read'));
  });
}
