import { Request, Response } from 'express';
import { SupportService } from './support.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { HTTP_STATUS } from '../../constants/http.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export class SupportController {
  static createTicket = asyncHandler(async (req: Request, res: Response) => {
    const ticket = await SupportService.createTicket(req.user!.userId, req.body);
    res.status(HTTP_STATUS.CREATED).json(new ApiResponse(HTTP_STATUS.CREATED, ticket, 'Ticket submitted'));
  });

  static reportPlayer = asyncHandler(async (req: Request, res: Response) => {
    const report = await SupportService.reportPlayer(req.user!.userId, req.body);
    res.status(HTTP_STATUS.CREATED).json(new ApiResponse(HTTP_STATUS.CREATED, report, 'Player reported'));
  });

  static getTickets = asyncHandler(async (req: Request, res: Response) => {
    const tickets = await SupportService.getUserTickets(req.user!.userId, req.query);
    res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, tickets, 'Tickets retrieved'));
  });
}
