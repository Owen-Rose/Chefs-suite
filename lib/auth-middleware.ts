// lib/auth-middleware.ts
import { NextApiHandler, NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../pages/api/auth/[...nextauth]";
import { Permission, hasPermission } from "../types/Permission";
import { UserRole } from "../types/Roles";
import { RequestWithServices } from "./withServices";

// Update the interface to include the hasPermission method
export interface AuthenticatedRequest extends NextApiRequest {
  user?: {
    role: UserRole;
    id: string;
    hasPermission: (permission: Permission) => boolean;
    // Add other user properties as needed
  };
}

// Combined type with both auth and services
export interface AuthenticatedRequestWithServices extends RequestWithServices {
  user?: {
    role: UserRole;
    id: string;
    hasPermission: (permission: Permission) => boolean;
  };
}

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
  // We need to cast types here because of TypeScript's limitations with middleware composition
  const withServicesHandler = (req: AuthenticatedRequestWithServices, res: NextApiResponse) => handler(req, res);
  
  // Apply withApiAuth first, then the handler will get the enhanced request with services
  return withApiAuth(withServicesHandler as NextApiHandler, requiredPermission);
}