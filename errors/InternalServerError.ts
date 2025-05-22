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