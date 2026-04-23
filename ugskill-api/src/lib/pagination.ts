export interface PaginationParams {
  page: number;
  perPage: number;
}

export interface PaginationResult {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

export const parsePaginationQuery = (query: any): PaginationParams => {
  const page = Math.max(1, parseInt(query.page as string) || 1);
  const perPage = Math.min(100, Math.max(1, parseInt(query.perPage as string) || 20));
  
  return { page, perPage };
};

export const buildPaginationMeta = (
  total: number,
  page: number,
  perPage: number
): PaginationResult => {
  return {
    page,
    perPage,
    total,
    totalPages: Math.ceil(total / perPage),
  };
};

export const getOffset = (page: number, perPage: number): number => {
  return (page - 1) * perPage;
};
