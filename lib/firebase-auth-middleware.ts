// lib/firebase-auth-middleware.ts
import { NextApiRequest, NextApiResponse } from "next";
import { auth } from "./firebaseAdmin";

export interface AuthenticatedRequest extends NextApiRequest {
  user?: {
    uid: string;
    role: "Admin" | "Chef" | "Management" | "Staff";
  };
}

const roleHierarchy = {
  Admin: 4,
  Chef: 3,
  Management: 2,
  Staff: 1,
};

export function withAuth(
  handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeader.split("Bearer ")[1];
    try {
      const decodedToken = await auth.verifyIdToken(token);
      const userRecord = await auth.getUser(decodedToken.uid);

      // Assuming you store the user's role in Firebase custom claims
      const role = userRecord.customClaims?.role || "Staff";

      (req as AuthenticatedRequest).user = {
        uid: decodedToken.uid,
        role: role as "Admin" | "Chef" | "Management" | "Staff",
      };

      return handler(req as AuthenticatedRequest, res);
    } catch (error) {
      console.error("Error verifying Firebase ID token:", error);
      return res.status(401).json({ error: "Unauthorized" });
    }
  };
}

export function checkRole(
  requiredRole: "Admin" | "Chef" | "Management" | "Staff"
) {
  return (
    req: AuthenticatedRequest,
    res: NextApiResponse,
    next: () => void
  ) => {
    if (roleHierarchy[req.user.role] >= roleHierarchy[requiredRole]) {
      next();
    } else {
      res.status(403).json({ error: "Forbidden" });
    }
  };
}
