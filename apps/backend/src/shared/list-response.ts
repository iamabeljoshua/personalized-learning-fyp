export interface ListResponse<T> {
  data: T[];
}

export interface PaginationResponse<T> {
  data: T[];
  totalItems: number;
  totalPages: number;
  page: number;
  limit: number;
}
