# Task 2.1: Create Custom Error Classes

## Goal
Expand the error handling system by creating a comprehensive set of custom error classes to represent different types of application errors, enabling more precise error handling and improved API responses.

## Background
The application currently has two basic error classes (`NotFoundError` and `ValidationError`). A more robust error system will help standardize error handling across the application, provide more meaningful error messages to users, and simplify error reporting and debugging.

## Implementation Steps

1. Create a base `AppError` class that all custom errors will extend:
   ```typescript
   // errors/AppError.ts
   
   export enum ErrorCode {
     VALIDATION_ERROR = 'VALIDATION_ERROR',
     NOT_FOUND = 'NOT_FOUND',
     UNAUTHORIZED = 'UNAUTHORIZED',
     FORBIDDEN = 'FORBIDDEN',
     CONFLICT = 'CONFLICT',
     INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
     BAD_REQUEST = 'BAD_REQUEST',
     DATABASE_ERROR = 'DATABASE_ERROR',
     NETWORK_ERROR = 'NETWORK_ERROR',
     UNKNOWN_ERROR = 'UNKNOWN_ERROR'
   }
   
   export type ErrorDetails = Record<string, any>;
   
   export interface AppErrorOptions {
     code: ErrorCode;
     statusCode?: number;
     details?: ErrorDetails;
     cause?: Error;
   }
   
   export class AppError extends Error {
     readonly code: ErrorCode;
     readonly statusCode: number;
     readonly details?: ErrorDetails;
     readonly cause?: Error;
     readonly timestamp: Date;
   
     constructor(message: string, options: AppErrorOptions) {
       super(message);
       this.name = this.constructor.name;
       this.code = options.code;
       this.statusCode = options.statusCode || this.getDefaultStatusCode(options.code);
       this.details = options.details;
       this.cause = options.cause;
       this.timestamp = new Date();
       
       // Properly capture stack trace
       if (Error.captureStackTrace) {
         Error.captureStackTrace(this, this.constructor);
       }
     }
     
     private getDefaultStatusCode(code: ErrorCode): number {
       switch (code) {
         case ErrorCode.VALIDATION_ERROR:
           return 400;
         case ErrorCode.BAD_REQUEST:
           return 400;
         case ErrorCode.UNAUTHORIZED:
           return 401;
         case ErrorCode.FORBIDDEN:
           return 403;
         case ErrorCode.NOT_FOUND:
           return 404;
         case ErrorCode.CONFLICT:
           return 409;
         case ErrorCode.NETWORK_ERROR:
           return 500;
         case ErrorCode.DATABASE_ERROR:
           return 500;
         case ErrorCode.INTERNAL_SERVER_ERROR:
         case ErrorCode.UNKNOWN_ERROR:
         default:
           return 500;
       }
     }
     
     toJSON() {
       return {
         name: this.name,
         message: this.message,
         code: this.code,
         statusCode: this.statusCode,
         details: this.details,
         timestamp: this.timestamp,
         stack: process.env.NODE_ENV === 'development' ? this.stack : undefined
       };
     }
   }
   ```

2. Update the existing `ValidationError` class to extend from `AppError`:
   ```typescript
   // errors/ValidationError.ts
   
   import { AppError, ErrorCode, ErrorDetails } from './AppError';
   
   export interface ValidationErrorDetails extends ErrorDetails {
     field?: string;
     value?: any;
     constraint?: string;
   }
   
   export class ValidationError extends AppError {
     constructor(
       message: string, 
       details?: ValidationErrorDetails | ValidationErrorDetails[],
       cause?: Error
     ) {
       super(message, {
         code: ErrorCode.VALIDATION_ERROR,
         statusCode: 400,
         details: details ? Array.isArray(details) ? { fields: details } : details : undefined,
         cause
       });
     }
     
     static fromFieldError(
       field: string, 
       message: string, 
       value?: any, 
       constraint?: string
     ): ValidationError {
       return new ValidationError(
         `Validation failed: ${message}`,
         { field, value, constraint }
       );
     }
     
     static fromFieldErrors(fieldErrors: ValidationErrorDetails[]): ValidationError {
       return new ValidationError(
         'Multiple validation errors occurred',
         fieldErrors
       );
     }
   }
   ```

3. Update the existing `NotFoundError` class to extend from `AppError`:
   ```typescript
   // errors/NotFoundError.ts
   
   import { AppError, ErrorCode, ErrorDetails } from './AppError';
   
   export interface NotFoundErrorDetails extends ErrorDetails {
     resource?: string;
     id?: string | number;
   }
   
   export class NotFoundError extends AppError {
     constructor(
       message: string, 
       details?: NotFoundErrorDetails,
       cause?: Error
     ) {
       super(message, {
         code: ErrorCode.NOT_FOUND,
         statusCode: 404,
         details,
         cause
       });
     }
     
     static resource(
       resourceName: string, 
       id?: string | number, 
       cause?: Error
     ): NotFoundError {
       const idMsg = id ? ` with ID '${id}'` : '';
       return new NotFoundError(
         `${resourceName}${idMsg} not found`,
         { resource: resourceName, id },
         cause
       );
     }
   }
   ```

4. Create an `UnauthorizedError` class:
   ```typescript
   // errors/UnauthorizedError.ts
   
   import { AppError, ErrorCode, ErrorDetails } from './AppError';
   
   export class UnauthorizedError extends AppError {
     constructor(
       message: string = 'Authentication required', 
       details?: ErrorDetails,
       cause?: Error
     ) {
       super(message, {
         code: ErrorCode.UNAUTHORIZED,
         statusCode: 401,
         details,
         cause
       });
     }
   }
   ```

5. Create a `ForbiddenError` class:
   ```typescript
   // errors/ForbiddenError.ts
   
   import { AppError, ErrorCode, ErrorDetails } from './AppError';
   import { Permission } from '../types/Permission';
   
   export interface ForbiddenErrorDetails extends ErrorDetails {
     requiredPermission?: Permission;
     userRole?: string;
   }
   
   export class ForbiddenError extends AppError {
     constructor(
       message: string = 'Access forbidden', 
       details?: ForbiddenErrorDetails,
       cause?: Error
     ) {
       super(message, {
         code: ErrorCode.FORBIDDEN,
         statusCode: 403,
         details,
         cause
       });
     }
     
     static missingPermission(
       permission: Permission, 
       userRole?: string
     ): ForbiddenError {
       return new ForbiddenError(
         `Insufficient permissions: ${permission} is required`,
         { requiredPermission: permission, userRole }
       );
     }
   }
   ```

6. Create a `ConflictError` class:
   ```typescript
   // errors/ConflictError.ts
   
   import { AppError, ErrorCode, ErrorDetails } from './AppError';
   
   export interface ConflictErrorDetails extends ErrorDetails {
     resource?: string;
     field?: string;
     value?: any;
   }
   
   export class ConflictError extends AppError {
     constructor(
       message: string, 
       details?: ConflictErrorDetails,
       cause?: Error
     ) {
       super(message, {
         code: ErrorCode.CONFLICT,
         statusCode: 409,
         details,
         cause
       });
     }
     
     static duplicate(
       resource: string, 
       field: string, 
       value: any
     ): ConflictError {
       return new ConflictError(
         `${resource} with ${field} '${value}' already exists`,
         { resource, field, value }
       );
     }
   }
   ```

7. Create a `DatabaseError` class:
   ```typescript
   // errors/DatabaseError.ts
   
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
   ```

8. Create a generic `BadRequestError` class:
   ```typescript
   // errors/BadRequestError.ts
   
   import { AppError, ErrorCode, ErrorDetails } from './AppError';
   
   export class BadRequestError extends AppError {
     constructor(
       message: string, 
       details?: ErrorDetails,
       cause?: Error
     ) {
       super(message, {
         code: ErrorCode.BAD_REQUEST,
         statusCode: 400,
         details,
         cause
       });
     }
   }
   ```

9. Create an `InternalServerError` class:
   ```typescript
   // errors/InternalServerError.ts
   
   import { AppError, ErrorCode, ErrorDetails } from './AppError';
   
   export class InternalServerError extends AppError {
     constructor(
       message: string = 'Internal server error', 
       details?: ErrorDetails,
       cause?: Error
     ) {
       super(message, {
         code: ErrorCode.INTERNAL_SERVER_ERROR,
         statusCode: 500,
         details,
         cause
       });
     }
   }
   ```

10. Create an index file to export all error classes:
    ```typescript
    // errors/index.ts
    
    export * from './AppError';
    export * from './BadRequestError';
    export * from './ConflictError';
    export * from './DatabaseError';
    export * from './ForbiddenError';
    export * from './InternalServerError';
    export * from './NotFoundError';
    export * from './UnauthorizedError';
    export * from './ValidationError';
    ```

11. Create a utility function to convert any error to an `AppError`:
    ```typescript
    // errors/utils.ts
    
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
    ```

12. Create unit tests for the error classes and utility functions in `__tests__/errors`.

## Files to Create/Modify
- `errors/AppError.ts` (new file)
- `errors/ValidationError.ts` (update)
- `errors/NotFoundError.ts` (update)
- `errors/UnauthorizedError.ts` (new file)
- `errors/ForbiddenError.ts` (new file)
- `errors/ConflictError.ts` (new file)
- `errors/DatabaseError.ts` (new file)
- `errors/BadRequestError.ts` (new file)
- `errors/InternalServerError.ts` (new file)
- `errors/index.ts` (new file)
- `errors/utils.ts` (new file)
- `__tests__/errors/*.test.ts` (new files)

## Verification Steps
1. Run TypeScript compiler to ensure no type errors
2. Run unit tests for the error classes
3. Manually test error serialization and conversion
4. Verify that error details and stack traces are properly handled
5. Check that error codes map to appropriate HTTP status codes

## Dependencies
None - this is a standalone task

## Estimated Effort
Medium (3-4 hours)

## Notes
- Ensure error classes provide enough context for debugging
- Make error messages user-friendly and helpful
- Consider security implications of error information exposure
- In production, stack traces should not be exposed in API responses
- Consider internationalization requirements for error messages (i18n)
- Add JSDoc comments to improve IDE support