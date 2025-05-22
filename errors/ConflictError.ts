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