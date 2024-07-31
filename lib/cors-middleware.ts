import Cors from "cors";
import { NextApiRequest, NextApiResponse } from "next";

const cors = Cors({
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  origin: "*", // Be careful with this in production
  optionsSuccessStatus: 200,
});

export function runMiddleware(
  req: NextApiRequest,
  res: NextApiResponse,
  fn: Function
) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

const corsMiddleware = (
  req: NextApiRequest,
  res: NextApiResponse,
  next: () => void
) => {
  cors(req, res, (result: any) => {
    if (result instanceof Error) {
      return res.status(500).end(result.message);
    }
    next();
  });
};

export default corsMiddleware;
