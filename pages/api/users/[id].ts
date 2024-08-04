import { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import { connectToDatabase } from "../../../lib/mongodb";
import { ObjectId } from "mongodb";
import { hash } from "bcryptjs";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getSession({ req });
  if (!session || session.user.role !== "ADMIN") {
    return res.status(403).json({ error: "Not authorized" });
  }

  const { db } = await connectToDatabase();
  const { id } = req.query;

  if (req.method === "GET") {
    const user = await db
      .collection("users")
      .findOne(
        { _id: new ObjectId(id as string) },
        { projection: { password: 0 } }
      );
    if (!user) return res.status(404).json({ error: "User not found" });
    res.status(200).json(user);
  } else if (req.method === "PUT") {
    const { name, email, password, role } = req.body;
    const updateData: any = { name, email, role, updatedAt: new Date() };
    if (password) {
      updateData.password = await hash(password, 12);
    }
    await db
      .collection("users")
      .updateOne({ _id: new ObjectId(id as string) }, { $set: updateData });
    res.status(200).json({ message: "User updated" });
  } else if (req.method === "DELETE") {
    await db.collection("users").deleteOne({ _id: new ObjectId(id as string) });
    res.status(200).json({ message: "User deleted" });
  } else {
    res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

const handleGetUser = async (
  req: NextApiRequest,
  res: NextApiResponse,
  db: any,
  userId: ObjectId
) => {
  try {
    const user = await db
      .collection("users")
      .findOne({ _id: userId }, { projection: { password: 0 } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
};

const handleUpdateUser = async (
  req: NextApiRequest,
  res: NextApiResponse,
  db: any,
  userId: ObjectId
) => {
  const { email, password, role, FirstName, LastName } = req.body;

  try {
    const updateData: any = { email, role, FirstName, LastName };
    if (password) {
      updateData.password = await hash(password, 12);
    }

    const result = await db
      .collection("users")
      .updateOne({ _id: userId }, { $set: updateData });

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ message: "User updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update user" });
  }
};

const handleDeleteUser = async (
  req: NextApiRequest,
  res: NextApiResponse,
  db: any,
  userId: ObjectId
) => {
  try {
    const result = await db.collection("users").deleteOne({ _id: userId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete user" });
  }
};
