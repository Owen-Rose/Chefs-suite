import { AppError, ErrorCode } from './AppError';
import { ValidationError } from './ValidationError';
import { NotFoundError } from './NotFoundError';
import { UnauthorizedError } from './UnauthorizedError';
import { ForbiddenError } from './ForbiddenError';
import { ConflictError } from './ConflictError';
import { DatabaseError } from './DatabaseError';
import { BadRequestError } from './BadRequestError';
import { InternalServerError } from './InternalServerError';

/**
 * Converts any error to an AppError
 * 
 * @param error - The error to convert
 * @param defaultMessage - Default message to use if the error doesn't have one
 * @returns An instance of AppError
 */
export function toAppError(
  error: unknown,
  defaultMessage: string = 'An unexpected error occurred'
): AppError {
  // If it's already an AppError, return it
  if (error instanceof AppError) {
    return error;
  }
  
  // If it's a standard Error, convert it based on name or message
  if (error instanceof Error) {
    const message = error.message || defaultMessage;
    
    // Check for common error patterns
    if (error.name === 'ValidationError' || message.toLowerCase().includes('validation')) {
      return new ValidationError(message, undefined, error);
    }
    
    if (error.name === 'NotFoundError' || message.toLowerCase().includes('not found')) {
      return new NotFoundError(message, undefined, error);
    }
    
    if (error.name === 'UnauthorizedError' || message.toLowerCase().includes('unauthorized') || 
        message.toLowerCase().includes('unauthenticated')) {
      return new UnauthorizedError(message, undefined, error);
    }
    
    if (error.name === 'ForbiddenError' || message.toLowerCase().includes('forbidden') || 
        message.toLowerCase().includes('permission')) {
      return new ForbiddenError(message, undefined, error);
    }
    
    if (message.toLowerCase().includes('duplicate') || message.toLowerCase().includes('already exists')) {
      return new ConflictError(message, undefined, error);
    }
    
    if (message.toLowerCase().includes('database') || message.toLowerCase().includes('db error')) {
      return new DatabaseError(message, undefined, error);
    }
    
    if (message.toLowerCase().includes('bad request') || message.toLowerCase().includes('invalid')) {
      return new BadRequestError(message, undefined, error);
    }
    
    // Default to InternalServerError for other Error instances
    return new InternalServerError(message, undefined, error);
  }
  
  // For non-Error objects or primitives
  let errorMessage: string;
  
  if (typeof error === 'string') {
    errorMessage = error;
  } else if (error && typeof error === 'object') {
    errorMessage = (error as any).message || defaultMessage;
  } else {
    errorMessage = defaultMessage;
  }
  
  return new InternalServerError(errorMessage, { originalError: error });
}