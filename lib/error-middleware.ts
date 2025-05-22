import { NextApiRequest, NextApiResponse, NextApiHandler } from "next";
import { 
  AppError, 
  ErrorCode, 
  toAppError, 
  ValidationError 
} from "../errors";
import { Logger } from "../utils/logger";

export type ApiHandler = NextApiHandler;

export type ErrorHandlerOptions = {
  logErrors?: boolean;
  includeErrorDetails?: boolean;
  includeStackTrace?: boolean;
  generateRequestId?: boolean;
  useLegacyFormat?: boolean;
};

interface RequestWithId extends NextApiRequest {
  requestId?: string;
  startTime?: number;
}

export function withErrorHandler(
  handler: ApiHandler,
  options: ErrorHandlerOptions = {}
): ApiHandler {
  const { 
    logErrors = true,
    includeErrorDetails = process.env.NODE_ENV !== "production",
    includeStackTrace = process.env.NODE_ENV !== "production",
    generateRequestId = true,
    useLegacyFormat = true
  } = options;

  return async (req: NextApiRequest, res: NextApiResponse) => {
    const extendedReq = req as RequestWithId;
    
    if (generateRequestId) {
      extendedReq.requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      extendedReq.startTime = Date.now();
    }

    try {
      await handler(req, res);
    } catch (error) {
      const appError = toAppError(error);
      
      const errorResponse = useLegacyFormat 
        ? { error: appError.message }
        : {
            error: {
              message: appError.message,
              code: appError.code,
              ...(includeErrorDetails && { 
                details: appError.details,
                timestamp: appError.timestamp,
                ...(includeStackTrace && { 
                  stack: appError.stack,
                  cause: appError.cause ? {
                    message: appError.cause.message,
                    stack: appError.cause.stack
                  } : undefined
                })
              })
            }
          };

      if (logErrors) {
        const duration = extendedReq.startTime ? Date.now() - extendedReq.startTime : undefined;
        const logContext = {
          requestId: extendedReq.requestId,
          url: req.url,
          method: req.method,
          userAgent: req.headers['user-agent'],
          statusCode: appError.statusCode,
          errorCode: appError.code,
          errorName: appError.name,
          ...(duration && { duration })
        };
        
        if (appError.statusCode >= 500) {
          Logger.error(appError.message, { error: appError, ...logContext });
        } else {
          Logger.warn(appError.message, { error: appError, ...logContext });
        }
      }

      if (!res.headersSent) {
        res.status(appError.statusCode).json(errorResponse);
      }
    }
  };
}

export function withApiErrorHandler(
  methodHandlers: Record<string, ApiHandler>,
  options: ErrorHandlerOptions = {}
): ApiHandler {
  return withErrorHandler(async (req: NextApiRequest, res: NextApiResponse) => {
    const method = req.method?.toUpperCase() || "GET";
    const handler = methodHandlers[method];

    if (!handler) {
      const allowedMethods = Object.keys(methodHandlers).join(", ");
      res.setHeader("Allow", allowedMethods);
      throw new ValidationError(`Method ${method} Not Allowed`);
    }

    await handler(req, res);
  }, options);
}