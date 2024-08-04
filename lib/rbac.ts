import { NextApiHandler, NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";

export function withAuth(handler: NextApiHandler, allowedRoles: string[]) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const session = await getSession({ req });
    if (!session || !allowedRoles.includes(session.user.role)) {
      return res.status(403).json({ error: "Not authorized" });
    }
    return handler(req, res);
  };
}
