# Task 2.2: Implement Error Handling Middleware

## Goal
Create a standardized error handling middleware for Next.js API routes that will properly handle, log, and return appropriate responses for all errors in the application.

## Background
Currently, error handling in API endpoints is inconsistent and repetitive. By implementing centralized error handling middleware, we can ensure that all errors are properly processed, logged, and returned to the client with appropriate status codes and details.

## Implementation Steps

1. Create a type for API handlers that can be wrapped with error handling:
   ```typescript
   // lib/error-middleware.ts
   
   import { NextApiRequest, NextApiResponse } from "next";
   
   export type ApiHandler = (
     req: NextApiRequest,
     res: NextApiResponse
   ) => Promise<void | NextApiResponse> | void | NextApiResponse;
   
   export type ErrorHandlerOptions = {
     logErrors?: boolean;
     includeErrorDetails?: boolean;
   };
   ```

2. Create a middleware wrapper function that handles errors:
   ```typescript
   // lib/error-middleware.ts (continued)
   
   import { 
     AppError, 
     ErrorCode, 
     toAppError, 
     ValidationError, 
     NotFoundError, 
     UnauthorizedError,
     ForbiddenError
   } from "../errors";
   import { logger } from "../utils/logger";
   
   /**
    * Wraps an API handler with standard error handling
    * 
    * @param handler - The API handler to wrap
    * @param options - Configuration options for error handling
    * @returns A wrapped handler with error handling
    */
   export function withErrorHandler(
     handler: ApiHandler,
     options: ErrorHandlerOptions = {}
   ): ApiHandler {
     const { 
       logErrors = true, 
       includeErrorDetails = process.env.NODE_ENV !== "production" 
     } = options;
   
     return async (req: NextApiRequest, res: NextApiResponse) => {
       try {
         // Call the original handler
         await handler(req, res);
       } catch (error) {
         // Convert to a standardized AppError
         const appError = toAppError(error);
         
         // Determine fields to include in response
         const errorResponse = {
           error: {
             message: appError.message,
             code: appError.code,
             ...(includeErrorDetails && { 
               details: appError.details,
               timestamp: appError.timestamp,
               ...(process.env.NODE_ENV !== "production" && { 
                 stack: appError.stack,
                 cause: appError.cause ? {
                   message: appError.cause.message,
                   stack: appError.cause.stack
                 } : undefined
               })
             })
           }
         };
   
         // Log the error
         if (logErrors) {
           const logContext = {
             url: req.url,
             method: req.method,
             statusCode: appError.statusCode,
             requestId: req.headers['x-request-id'] || undefined,
             errorCode: appError.code,
             errorName: appError.name
           };
           
           if (appError.statusCode >= 500) {
             logger.error(appError.message, { error: appError, ...logContext });
           } else {
             logger.warn(appError.message, { error: appError, ...logContext });
           }
         }
   
         // Send appropriate response based on error type
         res.status(appError.statusCode).json(errorResponse);
       }
     };
   }
   ```

3. Create a utility to wrap an entire API route handler with error handling:
   ```typescript
   // lib/error-middleware.ts (continued)
   
   /**
    * Wraps an API route handler with error handling
    * 
    * This is a convenience method for Next.js API routes where you need
    * to handle multiple HTTP methods and want error handling for all of them.
    * 
    * @param methodHandlers - Object mapping HTTP methods to their handlers
    * @param options - Configuration options for error handling
    * @returns A single handler with error handling for all methods
    */
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
   ```

4. Integrate the error handling middleware with the authentication middleware:
   ```typescript
   // lib/auth-middleware.ts
   
   import { NextApiRequest, NextApiResponse } from "next";
   import { getServerSession } from "next-auth/next";
   import { authOptions } from "../pages/api/auth/[...nextauth]";
   import { Permission } from "../types/Permission";
   import { ApiHandler, withErrorHandler } from "./error-middleware";
   import { UnauthorizedError, ForbiddenError } from "../errors";
   
   export interface ExtendedNextApiRequest extends NextApiRequest {
     user?: {
       id: string;
       email: string;
       role: string;
     };
   }
   
   /**
    * Middleware to verify authentication and authorize based on permissions
    * 
    * @param handler - The API handler to protect
    * @param requiredPermission - The permission required to access this endpoint
    * @returns A wrapped handler with authentication and error handling
    */
   export function withApiAuth(
     handler: ApiHandler,
     requiredPermission?: Permission
   ): ApiHandler {
     return withErrorHandler(async (req: NextApiRequest, res: NextApiResponse) => {
       const session = await getServerSession(req, res, authOptions);
   
       if (!session) {
         throw new UnauthorizedError("Authentication required to access this resource");
       }
   
       const userRole = session.user?.role;
       const userId = session.user?.id;
       const userEmail = session.user?.email;
   
       if (!userRole || !userId || !userEmail) {
         throw new UnauthorizedError("Invalid session - missing user information");
       }
   
       // Check if the user has the required permission
       if (requiredPermission) {
         const hasPermission = await checkPermission(userRole, requiredPermission);
   
         if (!hasPermission) {
           throw ForbiddenError.missingPermission(requiredPermission, userRole);
         }
       }
   
       // Extend the request with user info
       const extendedReq = req as ExtendedNextApiRequest;
       extendedReq.user = {
         id: userId,
         email: userEmail,
         role: userRole
       };
   
       // Call the handler
       return await handler(extendedReq, res);
     });
   }
   
   // Keep the existing checkPermission function
   async function checkPermission(
     role: string,
     requiredPermission: Permission
   ): Promise<boolean> {
     // The existing permission check logic
     // ...
   }
   ```

5. Create a utility to wrap API handlers with CORS and error handling:
   ```typescript
   // lib/middleware.ts
   
   import { NextApiRequest, NextApiResponse } from "next";
   import { ApiHandler, withErrorHandler, ErrorHandlerOptions } from "./error-middleware";
   import corsMiddleware, { runMiddleware } from "./cors-middleware";
   
   /**
    * Wraps an API handler with CORS and error handling
    * 
    * @param handler - The API handler to wrap
    * @param options - Configuration options for error handling
    * @returns A wrapped handler with CORS and error handling
    */
   export function withCorsAndErrorHandler(
     handler: ApiHandler,
     options: ErrorHandlerOptions = {}
   ): ApiHandler {
     return withErrorHandler(async (req: NextApiRequest, res: NextApiResponse) => {
       // Apply CORS middleware
       await runMiddleware(req, res, corsMiddleware);
       
       // Call the original handler
       await handler(req, res);
     }, options);
   }
   
   /**
    * Creates an API route handler with CORS and error handling for multiple HTTP methods
    * 
    * @param methodHandlers - Object mapping HTTP methods to their handlers
    * @param options - Configuration options for error handling
    * @returns A handler with CORS and error handling for all methods
    */
   export function createApiRoute(
     methodHandlers: Record<string, ApiHandler>,
     options: ErrorHandlerOptions = {}
   ): ApiHandler {
     return withCorsAndErrorHandler(async (req: NextApiRequest, res: NextApiResponse) => {
       const method = req.method?.toUpperCase() || "GET";
       const handler = methodHandlers[method];
   
       if (!handler) {
         const allowedMethods = Object.keys(methodHandlers).join(", ");
         res.setHeader("Allow", allowedMethods);
         res.status(405).json({ error: { message: `Method ${method} Not Allowed` } });
         return;
       }
   
       await handler(req, res);
     }, options);
   }
   ```

6. Update an example API endpoint to use the error handling middleware:
   ```typescript
   // pages/api/recipes/index.ts
   
   import { NextApiRequest, NextApiResponse } from "next";
   import { withApiAuth } from "../../../lib/auth-middleware";
   import { Permission } from "../../../types/Permission";
   import { getRecipeService } from "../../../services/recipeService";
   import { createApiRoute } from "../../../lib/middleware";
   
   export default createApiRoute({
     GET: withApiAuth(getRecipes, Permission.VIEW_RECIPES),
     POST: withApiAuth(createRecipe, Permission.CREATE_RECIPES)
   });
   
   async function getRecipes(req: NextApiRequest, res: NextApiResponse) {
     // Parse query parameters
     const page = parseInt(req.query.page as string) || 1;
     const limit = parseInt(req.query.limit as string) || 10;
     const sortField = req.query.sortBy as string || "createdDate";
     const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
     
     // Create query options
     const options = {
       skip: (page - 1) * limit,
       limit,
       sort: { [sortField]: sortOrder } as Record<string, 1 | -1>
     };
     
     const recipeService = await getRecipeService();
     const result = await recipeService.getAllRecipes(options);
     
     res.status(200).json(result);
   }
   
   async function createRecipe(req: NextApiRequest, res: NextApiResponse) {
     const newRecipe = req.body;
     const recipeService = await getRecipeService();
     
     const recipe = await recipeService.createRecipe(newRecipe);
     res.status(201).json(recipe);
   }
   ```

7. Create unit tests for the error handling middleware in `__tests__/lib/error-middleware.test.ts`.

## Files to Create/Modify
- `lib/error-middleware.ts` (new file)
- `lib/middleware.ts` (new file)
- `lib/auth-middleware.ts` (update)
- `pages/api/**/*.ts` (update selected API endpoints to use the new middleware)
- `__tests__/lib/error-middleware.test.ts` (new file)

## Verification Steps
1. Run TypeScript compiler to ensure no type errors
2. Run unit tests for the error handling middleware
3. Test API endpoints to verify errors are properly handled
4. Check that appropriate HTTP status codes are returned for different error types
5. Verify error details are included in development but not in production
6. Check that errors are properly logged

## Dependencies
- Task 2.1: Create Custom Error Classes (to be completed)
- Task 2.3: Integrate Structured Logging (will be completed separately but related)

## Estimated Effort
Medium (3-4 hours)

## Notes
- Ensure error middleware works with existing authentication middleware
- Be careful with sensitive error information in production environments
- Consider adding request ID tracking for better error correlation
- Ensure consistent logging of errors across the application
- This task lays groundwork for App Router migration in Phase 3