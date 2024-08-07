import { NextApiHandler, NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../pages/api/auth/[...nextauth]";
import { Permission, hasPermission } from "../types/Permission";
import { UserRole } from "../types/Roles";

// Extend the NextApiRequest type to include the user property
export interface ExtendedNextApiRequest extends NextApiRequest {
  user?: {
    role: UserRole;
    // Add other user properties as needed
  };
}

export function withApiAuth(
  handler: NextApiHandler,
  requiredPermission: Permission
) {
  return async (req: ExtendedNextApiRequest, res: NextApiResponse) => {
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const userRole = session.user.role as UserRole;

    if (!hasPermission(userRole, requiredPermission)) {
      return res.status(403).json({ error: "Not authorized" });
    }

    // Add user information to the request object
    req.user = {
      role: userRole,
    };

    return handler(req, res);
  };
}
