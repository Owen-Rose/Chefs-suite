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