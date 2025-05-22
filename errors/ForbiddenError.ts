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