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