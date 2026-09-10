import { Request, Response } from 'express';
import { LobbyService } from './lobby.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { HTTP_STATUS } from '../../constants/http.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export class LobbyController {
  static create = asyncHandler(async (req: Request, res: Response) => {
    const lobby = await LobbyService.createLobby(req.user!.userId, req.body);
    res.status(HTTP_STATUS.CREATED).json(new ApiResponse(HTTP_STATUS.CREATED, lobby, 'Lobby created'));
  });

  static join = asyncHandler(async (req: Request, res: Response) => {
    const lobby = await LobbyService.joinLobby(req.params.code || req.body.code, req.user!.userId);
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, lobby, 'Joined lobby'));
  });

  static leave = asyncHandler(async (req: Request, res: Response) => {
    const result = await LobbyService.leaveLobby(req.params.lobbyId as any, req.user!.userId);
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, result, 'Left lobby'));
  });

  static getPublic = asyncHandler(async (req: Request, res: Response) => {
    const gameId = req.query.gameId as string | undefined;
    const lobbies = await LobbyService.getPublicLobbies(gameId);
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, lobbies, 'Public lobbies retrieved'));
  });

  static getById = asyncHandler(async (req: Request, res: Response) => {
    const lobby = await LobbyService.getLobbyById(req.params.lobbyId as any);
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, lobby, 'Lobby details retrieved'));
  });
}
