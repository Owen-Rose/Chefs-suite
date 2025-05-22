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