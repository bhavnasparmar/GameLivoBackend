import { PaginationParams, PaginatedResult } from '../types/common.js';

export function getPaginationOptions(query: any): Required<PaginationParams> {
  const page = Math.max(1, parseInt(query.page as string, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit as string, 10) || 20));
  const sortBy = (query.sortBy as string) || 'createdAt';
  const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

  return { page, limit, sortBy, sortOrder };
}

export function formatPaginatedResult<T>(
  docs: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResult<T> {
  const totalPages = Math.ceil(total / limit) || 1;
  return {
    docs,
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}
