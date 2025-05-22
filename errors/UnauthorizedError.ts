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