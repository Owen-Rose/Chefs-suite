import { NextApiResponse } from "next";
import { ObjectId } from "mongodb";
import { connectToDatabase } from "../../../lib/mongodb";
import {
  withApiAuth,
  ExtendedNextApiRequest,
} from "../../../lib/auth-middleware";
import { Permission } from "../../../types/Permission";
import { Archive } from "../../../types/Archive";
import { UserRole } from "../../../types/Roles";

async function handler(req: ExtendedNextApiRequest, res: NextApiResponse) {
  const { method } = req;
  const { db, archives } = await connectToDatabase();

  switch (method) {
    case "GET":
      return withApiAuth(getArchives, Permission.VIEW_RECIPES)(req, res);
    case "POST":
      return withApiAuth(createArchive, Permission.EDIT_RECIPES)(req, res);
    default:
      res.setHeader("Allow", ["GET", "POST"]);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}

async function getArchives(req: ExtendedNextApiRequest, res: NextApiResponse) {
  const { archives } = await connectToDatabase();
  try {
    const allArchives = await archives.find({}).toArray();
    res.status(200).json(allArchives);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch archives" });
  }
}

async function createArchive(
  req: ExtendedNextApiRequest,
  res: NextApiResponse
) {
  const { archives } = await connectToDatabase();
  try {
    const { name, description } = req.body;
    const userId = new ObjectId(req.user?.id);

    if (!name) {
      return res.status(400).json({ error: "Archive name is required" });
    }

    const newArchive: Archive = {
      name,
      description,
      createdDate: new Date(),
      lastModifiedDate: new Date(),
      createdBy: userId,
    };

    const result = await archives.insertOne(newArchive);
    res.status(201).json({ ...newArchive, _id: result.insertId });
  } catch (error) {
    res.status(500).json({ error: "Failed to create archive" });
  }
}

export default handler;
