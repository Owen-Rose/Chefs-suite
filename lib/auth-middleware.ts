// lib/auth-middleware.ts
import { NextApiHandler, NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../pages/api/auth/[...nextauth]";
import { Permission, hasPermission } from "../types/Permission";
import { UserRole } from "../types/Roles";
import { RequestWithServices, withServices } from "./withServices";

/**
 * Request interface for authenticated requests
 */
export interface AuthenticatedRequest extends NextApiRequest {
  user?: {
    role: UserRole;
    id: string;
    hasPermission: (permission: Permission) => boolean;
  };
}

/**
 * Combined interface for requests with both authentication and services
 */
export interface AuthenticatedRequestWithServices extends RequestWithServices {
  user?: {
    role: UserRole;
    id: string;
    hasPermission: (permission: Permission) => boolean;
  };
}

/**
 * Alias for backward compatibility
 * @deprecated Use AuthenticatedRequest instead
 */
export interface ExtendedNextApiRequest extends AuthenticatedRequest {}

/**
 * Middleware to check authentication and authorization for API routes
 * 
 * @param handler - The API route handler function
 * @param requiredPermission - The permission required to access this endpoint
 * @returns A new handler with authentication checks
 */
export function withApiAuth(
  handler: NextApiHandler,
  requiredPermission: Permission
) {
  return async (req: AuthenticatedRequest, res: NextApiResponse) => {
    try {
      const session = await getServerSession(req, res, authOptions);

      if (!session || !session.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const userRole = session.user.role as UserRole;

      if (!hasPermission(userRole, requiredPermission)) {
        return res.status(403).json({ error: "Not authorized" });
      }

      // Add the hasPermission method to the user object
      req.user = {
        role: userRole,
        id: session.user.id as string,
        hasPermission: (permission: Permission) => hasPermission(userRole, permission)
      };

      return handler(req, res);
    } catch (error) {
      console.error("Auth middleware error:", error);
      return res.status(500).json({ error: "Authentication error", details: error instanceof Error ? error.message : "Unknown error" });
    }
  };
}

/**
 * Combined middleware to provide both authentication and services to API routes
 * 
 * @param handler - The API route handler function
 * @param requiredPermission - The permission required to access this endpoint
 * @returns A new handler with authentication and services
 */
export function withAuthAndServices(
  handler: (req: AuthenticatedRequestWithServices, res: NextApiResponse) => Promise<void> | void,
  requiredPermission: Permission
) {
  // First apply withServices, then withApiAuth
  const servicesHandler = withServices((req, res) => handler(req as AuthenticatedRequestWithServices, res));
  return withApiAuth(servicesHandler, requiredPermission);
}