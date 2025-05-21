import { ListResult, QueryOptions, TransactionContext } from './types';

/**
 * Base repository interface for standardizing data access across the application.
 * Provides a generic interface for CRUD operations that all repositories should implement.
 * 
 * Individual repositories may extend this interface with domain-specific methods
 * to handle specialized queries and operations for their specific entity types.
 * 
 * @template T - The document type that this repository manages
 * @template IdType - The type of the document's ID field (defaults to string)
 * @template TxContext - The transaction context type (defaults to TransactionContext)
 */
export interface BaseRepository<T, IdType = string, TxContext = TransactionContext> {
  /**
   * Find all documents matching the specified query options
   * 
   * @param options - Query options for filtering, sorting, and pagination
   * @param txContext - Optional transaction context for database operations
   * @returns A promise resolving to a paginated list result containing the matching documents
   */
  findAll(options?: QueryOptions, txContext?: TxContext): Promise<ListResult<T>>;

  /**
   * Find a single document by its ID
   * 
   * @param id - The unique identifier of the document
   * @param txContext - Optional transaction context for database operations
   * @returns A promise resolving to the found document or null if not found
   */
  findById(id: IdType, txContext?: TxContext): Promise<T | null>;

  /**
   * Find documents matching the provided filter criteria
   * 
   * @param filter - The filter criteria to apply
   * @param options - Optional query options for sorting and pagination
   * @param txContext - Optional transaction context for database operations
   * @returns A promise resolving to a paginated list result containing the matching documents
   */
  findByFilter(filter: Record<string, any>, options?: QueryOptions, txContext?: TxContext): Promise<ListResult<T>>;

  /**
   * Create a new document
   * 
   * @param data - The document data to insert (without ID)
   * @param txContext - Optional transaction context for database operations
   * @returns A promise resolving to the created document with its generated ID
   */
  create(data: Omit<T, '_id'>, txContext?: TxContext): Promise<T>;

  /**
   * Create multiple documents in a single operation
   * 
   * @param data - An array of document data to insert (without IDs)
   * @param txContext - Optional transaction context for database operations
   * @returns A promise resolving to an array of created documents with their generated IDs
   */
  createMany(data: Omit<T, '_id'>[], txContext?: TxContext): Promise<T[]>;

  /**
   * Update an existing document by ID
   * 
   * @param id - The unique identifier of the document to update
   * @param data - The partial data to update in the document
   * @param txContext - Optional transaction context for database operations
   * @returns A promise resolving to the updated document
   * @throws Error if the document is not found
   */
  update(id: IdType, data: Partial<T>, txContext?: TxContext): Promise<T>;

  /**
   * Upsert a document (create if it doesn't exist, update if it does)
   * 
   * @param filter - The filter criteria to find the document to update
   * @param data - The data to upsert
   * @param txContext - Optional transaction context for database operations
   * @returns A promise resolving to the upserted document
   */
  upsert(filter: Record<string, any>, data: Partial<T>, txContext?: TxContext): Promise<T>;

  /**
   * Delete a document by ID
   * 
   * @param id - The unique identifier of the document to delete
   * @param txContext - Optional transaction context for database operations
   * @returns A promise that resolves when the document is deleted
   * @throws Error if the document is not found
   */
  delete(id: IdType, txContext?: TxContext): Promise<void>;

  /**
   * Delete documents matching the provided filter criteria
   * 
   * @param filter - The filter criteria to determine which documents to delete
   * @param txContext - Optional transaction context for database operations
   * @returns A promise resolving to the number of deleted documents
   */
  deleteMany(filter: Record<string, any>, txContext?: TxContext): Promise<number>;

  /**
   * Count documents matching the provided filter criteria
   * 
   * @param filter - The filter criteria to apply
   * @param txContext - Optional transaction context for database operations
   * @returns A promise resolving to the count of matching documents
   */
  count(filter?: Record<string, any>, txContext?: TxContext): Promise<number>;

  /**
   * Check if a document with the given ID exists
   * 
   * @param id - The unique identifier to check
   * @param txContext - Optional transaction context for database operations
   * @returns A promise resolving to true if the document exists, false otherwise
   */
  exists(id: IdType, txContext?: TxContext): Promise<boolean>;
}