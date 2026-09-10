import { Request, Response } from 'express';
import { FriendsService } from './friends.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { HTTP_STATUS } from '../../constants/http.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export class FriendsController {
  static getFriends = asyncHandler(async (req: Request, res: Response) => {
    const friends = await FriendsService.getFriends(req.user!.userId);
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, friends, 'Friends list retrieved'));
  });

  static getRequests = asyncHandler(async (req: Request, res: Response) => {
    const requests = await FriendsService.getPendingRequests(req.user!.userId);
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, requests, 'Pending requests retrieved'));
  });

  static sendRequest = asyncHandler(async (req: Request, res: Response) => {
    const request = await FriendsService.sendRequest(req.user!.userId, req.body.receiverId);
    res.status(HTTP_STATUS.CREATED).json(new ApiResponse(HTTP_STATUS.CREATED, request, 'Friend request sent'));
  });

  static acceptRequest = asyncHandler(async (req: Request, res: Response) => {
    const result = await FriendsService.respondToRequest(req.params.requestId as any, req.user!.userId, 'accept');
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, result, result.message));
  });

  static declineRequest = asyncHandler(async (req: Request, res: Response) => {
    const result = await FriendsService.respondToRequest(req.params.requestId as any, req.user!.userId, 'decline');
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, result, result.message));
  });

  static removeFriend = asyncHandler(async (req: Request, res: Response) => {
    await FriendsService.removeFriend(req.user!.userId, req.params.friendId as any);
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, null, 'Friend removed'));
  });

  static search = asyncHandler(async (req: Request, res: Response) => {
    const results = await FriendsService.searchUsers(req.query.q as string, req.user!.userId);
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, results, 'Search results'));
  });
}
