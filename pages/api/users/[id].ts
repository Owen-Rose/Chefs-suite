import { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "../../../lib/mongodb";
import { auth } from "../../../lib/firebaseAdmin";
import { Db, MongoClient } from "mongodb";

type DbType = {
  db: Db;
  client: MongoClient;
};

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { db }: DbType = await connectToDatabase();
  const { id } = req.query;

  switch (req.method) {
    case "GET":
      return handleGetUser(req, res, db, id as string);
    case "PUT":
      return handleUpdateUser(req, res, db, id as string);
    case "DELETE":
      return handleDeleteUser(req, res, db, id as string);
    default:
      return res.status(405).end();
  }
};

const handleGetUser = async (
  req: NextApiRequest,
  res: NextApiResponse,
  db: Db,
  id: string
) => {
  try {
    const user = await db.collection("users").findOne({ uid: id });
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
  db: Db,
  id: string
) => {
  const { email, password, role, ...rest } = req.body;

  try {
    // Update user in Firebase
    const updateParams: any = {};
    if (email) updateParams.email = email;
    if (password) updateParams.password = password;

    const updatedFirebaseUser = await auth.updateUser(id, updateParams);

    // Prepare update for MongoDB (exclude password)
    const updateData = {
      email: updatedFirebaseUser.email,
      role,
      ...rest,
    };

    // Update user in MongoDB
    const updateResult = await db
      .collection("users")
      .updateOne({ uid: id }, { $set: updateData });

    if (updateResult.modifiedCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res
      .status(200)
      .json({ message: "User updated successfully", user: updateData });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(400).json({ error: "An unknown error occurred" });
    }
  }
};

const handleDeleteUser = async (
  req: NextApiRequest,
  res: NextApiResponse,
  db: Db,
  id: string
) => {
  try {
    await auth.deleteUser(id);
    const deleteResult = await db.collection("users").deleteOne({ uid: id });

    if (deleteResult.deletedCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete user" });
  }
};

export default handler;
