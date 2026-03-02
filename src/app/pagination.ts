export interface PaginatedResult<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginationOptions {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export function paginate<T>(
  data: T[],
  options: PaginationOptions = {}
): PaginatedResult<T> {
  const {
    page = 1,
    pageSize = 20,
    sortBy,
    sortOrder = 'asc'
  } = options;

  const sorted = [...data];
  
  if (sortBy) {
    sorted.sort((a, b) => {
      const aVal = String((a as Record<string, unknown>)[sortBy] ?? '');
      const bVal = String((b as Record<string, unknown>)[sortBy] ?? '');
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }

  const total = sorted.length;
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const paged = sorted.slice(start, end);

  return {
    data: paged,
    page,
    pageSize,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1
  };
}

export function generatePageNumbers(current: number, total: number, maxVisible: number = 5): number[] {
  const pages: number[] = [];
  let start = Math.max(1, current - Math.floor(maxVisible / 2));
  const end = Math.min(total, start + maxVisible - 1);
  
  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1);
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  return pages;
}

export interface FilterOptions<T> {
  search?: string;
  searchFields?: (keyof T)[];
  filters?: Record<string, unknown>;
}

export function filterData<T>(data: T[], options: FilterOptions<T>): T[] {
  let result = [...data];

  if (options.search && options.searchFields?.length) {
    const searchLower = options.search.toLowerCase();
    result = result.filter(item =>
      options.searchFields!.some(field => {
        const value = item[field];
        return value && String(value).toLowerCase().includes(searchLower);
      })
    );
  }

  if (options.filters) {
    Object.entries(options.filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        result = result.filter(item => String((item as Record<string, unknown>)[key]) === String(value));
      }
    });
  }

  return result;
}
