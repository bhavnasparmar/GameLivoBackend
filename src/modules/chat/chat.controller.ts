import { Request, Response } from 'express';
import { ChatService } from './chat.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { HTTP_STATUS } from '../../constants/http.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export class ChatController {
  static getMessages = asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string, 10) || 50;
    const messages = await ChatService.getRoomMessages(req.params.roomId as any, limit);
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, messages, 'Messages retrieved'));
  });
}
