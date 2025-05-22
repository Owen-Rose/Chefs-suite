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