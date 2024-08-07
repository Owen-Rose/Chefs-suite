import { NextApiHandler, NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../pages/api/auth/[...nextauth]";
import { Permission, hasPermission } from "../types/Permission";
import { UserRole } from "../types/Roles";

export function withApiAuth(handler: NextApiHandler, requiredPermission: Permission) {
    return async (req: NextApiRequest, res: NextApiResponse) => {
        const session = await getServerSession(req, res, authOptions);

        if (!session || !session.user) {
            return res.status(401).json({ error: "Not authenticated" });
        }

        const userRole = session.user.role as UserRole;

        if (!hasPermission(userRole, requiredPermission)) {
            return res.status(403).json({ error: "Not authorized" });
        }

        return handler(req, res);
    };
}