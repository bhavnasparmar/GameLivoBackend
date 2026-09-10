import { SupportTicket, PlayerReport, ITicketDocument, IReportDocument } from './support.model.js';
import { formatPaginatedResult, getPaginationOptions } from '../../utils/pagination.js';

export class SupportService {
  static async createTicket(
    userId: string,
    data: {
      category: any;
      subject: string;
      message: string;
    }
  ): Promise<ITicketDocument> {
    return await SupportTicket.create({
      userId,
      category: data.category,
      subject: data.subject,
      message: data.message,
      status: 'open',
    });
  }

  static async reportPlayer(
    reporterId: string,
    data: {
      reportedUserId: string;
      matchId?: string;
      reason: any;
      description?: string;
    }
  ): Promise<IReportDocument> {
    return await PlayerReport.create({
      reporterId,
      reportedUserId: data.reportedUserId,
      matchId: data.matchId,
      reason: data.reason,
      description: data.description,
      status: 'pending',
    });
  }

  static async getUserTickets(userId: string, query: any) {
    const { page, limit, sortBy, sortOrder } = getPaginationOptions(query);
    const validSortOrder = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    const { count, rows } = await SupportTicket.findAndCountAll({
      where: { userId },
      order: [[sortBy, validSortOrder]],
      offset: (page - 1) * limit,
      limit,
    });

    return formatPaginatedResult(rows, count, page, limit);
  }
}
