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

  switch (req.method) {
    case "POST":
      return handleCreateUser(req, res, db);
    case "GET":
      return handleGetUsers(req, res, db);
    default:
      return res.status(405).end();
  }
};

const handleCreateUser = async (
  req: NextApiRequest,
  res: NextApiResponse,
  db: Db
) => {
  const { email, password, role, ...rest } = req.body;

  try {
    // Create user in Firebase
    const userRecord = await auth.createUser({
      email,
      password,
    });

    // Prepare user data for MongoDB (exclude password)
    const newUser = {
      uid: userRecord.uid,
      email,
      role,
      ...rest,
    };

    // Insert user into MongoDB
    await db.collection("users").insertOne(newUser);

    res
      .status(201)
      .json({ message: "User created successfully", user: newUser });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(400).json({ error: "An unknown error occurred" });
    }
  }
};

const handleGetUsers = async (
  req: NextApiRequest,
  res: NextApiResponse,
  db: Db
) => {
  try {
    const users = await db.collection("users").find().toArray();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

export default handler;
