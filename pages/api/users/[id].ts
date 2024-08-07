import { NextApiRequest, NextApiResponse } from "next";
import { ObjectId } from "mongodb";
import { connectToDatabase } from "../../../lib/mongodb";
import { withApiAuth } from "../../../lib/auth-middleware";
import { Permission } from "../../../types/Permission";
import { hash } from "bcryptjs";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!ObjectId.isValid(id as string)) {
    return res.status(400).json({ error: "Invalid user ID" });
  }

  switch (req.method) {
    case "GET":
      return withApiAuth(getUser, Permission.VIEW_USERS)(req, res);
    case "PUT":
      return withApiAuth(updateUser, Permission.EDIT_USERS)(req, res);
    case "DELETE":
      return withApiAuth(deleteUser, Permission.DELETE_USERS)(req, res);
    default:
      res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

async function getUser(req: NextApiRequest, res: NextApiResponse) {
  const { db } = await connectToDatabase();
  const { id } = req.query;

  try {
    const user = await db
      .collection("users")
      .findOne({ _id: new ObjectId(id as string) }, { projection: { password: 0 } });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
}

async function updateUser(req: NextApiRequest, res: NextApiResponse) {
  const { db } = await connectToDatabase();
  const { id } = req.query;
  const { email, password, FirstName, LastName, role } = req.body;

  try {
    const updateData: any = { email, FirstName, LastName, role, updatedAt: new Date() };
    if (password) {
      updateData.password = await hash(password, 12);
    }

    const result = await db
      .collection("users")
      .updateOne({ _id: new ObjectId(id as string) }, { $set: updateData });

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ message: "User updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update user" });
  }
}

async function deleteUser(req: NextApiRequest, res: NextApiResponse) {
  const { db } = await connectToDatabase();
  const { id } = req.query;

  try {
    const result = await db
      .collection("users")
      .deleteOne({ _id: new ObjectId(id as string) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete user" });
  }
}

export default handler;