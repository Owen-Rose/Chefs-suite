/**
 * Higher-order component for providing services to API route handlers
 */
import { NextApiRequest, NextApiResponse } from 'next';
import { container, ServiceToken } from './container';
import { ensureServicesInitialized } from './services';

/**
 * Type for a Next.js API handler function
 */
export type ApiHandler = (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void;

/**
 * Extended request interface with services
 */
export interface RequestWithServices extends NextApiRequest {
  services: {
    get: <T>(token: ServiceToken<T>) => T;
    has: (token: ServiceToken<any>) => boolean;
  };
}

/**
 * Creates a Next.js API route handler with access to the service container
 * 
 * @param handler - The API route handler function
 * @returns A new handler with services injected
 */
export function withServices(handler: (req: RequestWithServices, res: NextApiResponse) => Promise<void> | void): ApiHandler {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      // Ensure services are initialized
      await ensureServicesInitialized();
      
      // Create a request-scoped container if needed
      // For now we're using the global container
      const requestContainer = container;
      
      // Add services to the request object
      const reqWithServices = req as RequestWithServices;
      reqWithServices.services = {
        get: <T>(token: ServiceToken<T>): T => requestContainer.resolve<T>(token),
        has: (token: ServiceToken<any>): boolean => requestContainer.has(token)
      };
      
      // Call the original handler with the enhanced request
      return await handler(reqWithServices, res);
    } catch (error) {
      console.error('Service initialization error:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };
}

/**
 * Composes multiple middleware functions into a single middleware
 * This can be used to combine withServices with other middleware like authentication
 * 
 * @param middlewares - Array of middleware functions to compose
 * @returns A composed middleware function
 */
export function composeMiddleware(...middlewares: Array<(handler: ApiHandler) => ApiHandler>): (handler: ApiHandler) => ApiHandler {
  return (handler: ApiHandler) => {
    return middlewares.reduceRight((composed, middleware) => middleware(composed), handler);
  };
}