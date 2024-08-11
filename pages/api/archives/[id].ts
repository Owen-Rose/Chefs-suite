import { NextApiResponse } from "next";
import { ObjectId } from "mongodb";
import { connectToDatabase } from "../../../lib/mongodb";
import {
  withApiAuth,
  ExtendedNextApiRequest,
} from "../../../lib/auth-middleware";
import { Permission } from "../../../types/Permission";

async function handler(req: ExtendedNextApiRequest, res: NextApiResponse) {
  const { method } = req;
  const { id } = req.query;

  if (!ObjectId.isValid(id as string)) {
    return res.status(400).json({ error: "Invalid archive ID" });
  }

  switch (method) {
    case "GET":
      return withApiAuth(getArchive, Permission.VIEW_RECIPES)(req, res);
    case "PUT":
      return withApiAuth(updateArchive, Permission.EDIT_RECIPES)(req, res);
    case "DELETE":
      return withApiAuth(deleteArchive, Permission.DELETE_RECIPES)(req, res);
    default:
      res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}

async function getArchive(req: ExtendedNextApiRequest, res: NextApiResponse) {
  const { archives } = await connectToDatabase();
  const { id } = req.query;

  try {
    const archive = await archives.findOne({ _id: new ObjectId(id as string) });
    if (!archive) {
      return res.status(404).json({ error: "Archive not found" });
    }
    res.status(200).json(archive);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch archive" });
  }
}

async function updateArchive(
  req: ExtendedNextApiRequest,
  res: NextApiResponse
) {
  const { archives } = await connectToDatabase();
  const { id } = req.query;
  const { name, description } = req.body;

  try {
    const result = await archives.updateOne(
      { _id: new ObjectId(id as string) },
      {
        $set: {
          name,
          description,
          lastModifiedDate: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Archive not found" });
    }

    res.status(200).json({ message: "Archive updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update archive" });
  }
}

async function deleteArchive(
  req: ExtendedNextApiRequest,
  res: NextApiResponse
) {
  const { archives } = await connectToDatabase();
  const { id } = req.query;

  try {
    const result = await archives.deleteOne({
      _id: new ObjectId(id as string),
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Archive not found" });
    }

    res.status(200).json({ message: "Archive deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete archive" });
  }
}

export default handler;
