/**
 * Common query options for repository operations
 */
export interface QueryOptions {
  /** Number of documents to skip */
  skip?: number;
  
  /** Maximum number of documents to return */
  limit?: number;
  
  /** Sorting criteria, 1 for ascending, -1 for descending */
  sort?: Record<string, 1 | -1>;
  
  /** Filter criteria */
  filter?: Record<string, any>;
}

/**
 * Standardized result for paginated list operations
 */
export interface ListResult<T> {
  /** Array of items in the current page */
  items: T[];
  
  /** Total number of items matching the query */
  total: number;
  
  /** Current page number (1-based) */
  page: number;
  
  /** Number of items per page */
  pageSize: number;
  
  /** Total number of pages */
  totalPages: number;
}

/**
 * Common database error types
 */
export enum DatabaseErrorType {
  NOT_FOUND = 'NOT_FOUND',
  DUPLICATE = 'DUPLICATE',
  VALIDATION = 'VALIDATION',
  CONNECTION = 'CONNECTION',
  UNKNOWN = 'UNKNOWN'
}

/**
 * Base database error interface
 */
export interface DatabaseError {
  type: DatabaseErrorType;
  message: string;
  originalError?: unknown;
}

/**
 * Generic transaction context interface
 * This should be replaced with the specific database's session/transaction type when implementing
 */
export interface TransactionContext {
  session?: unknown;
}