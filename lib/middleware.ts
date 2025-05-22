import { NextApiRequest, NextApiResponse } from "next";
import { ApiHandler, withErrorHandler, ErrorHandlerOptions } from "./error-middleware";
import corsMiddleware, { runMiddleware } from "./cors-middleware";

export function withCorsAndErrorHandler(
  handler: ApiHandler,
  options: ErrorHandlerOptions = {}
): ApiHandler {
  return withErrorHandler(async (req: NextApiRequest, res: NextApiResponse) => {
    await runMiddleware(req, res, corsMiddleware);
    await handler(req, res);
  }, options);
}

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
      res.status(405).json({ error: `Method ${method} Not Allowed` });
      return;
    }

    await handler(req, res);
  }, options);
}