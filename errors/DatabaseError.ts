import { AppError, ErrorCode, ErrorDetails } from './AppError';
import { DatabaseErrorType } from '../repositories/base/types';

export interface DatabaseErrorDetails extends ErrorDetails {
  operation?: string;
  collection?: string;
  databaseErrorType?: DatabaseErrorType;
}

export class DatabaseError extends AppError {
  constructor(
    message: string, 
    details?: DatabaseErrorDetails,
    cause?: Error
  ) {
    super(message, {
      code: ErrorCode.DATABASE_ERROR,
      statusCode: 500,
      details,
      cause
    });
  }
  
  static operation(
    operation: string, 
    collection: string, 
    errorType: DatabaseErrorType,
    cause?: Error
  ): DatabaseError {
    return new DatabaseError(
      `Database error: Failed to ${operation} in ${collection}`,
      { operation, collection, databaseErrorType: errorType },
      cause
    );
  }
}