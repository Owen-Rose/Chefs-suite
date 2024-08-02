import { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "../../../lib/mongodb";
import { auth, UserRecord } from "../../../lib/firebaseAdmin"; // Updated import
import { Db, MongoClient } from "mongodb";
import { setUserRole } from "../../../lib/userManagement";
import { UserRole } from "../../../types/Roles";

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
  const { email, password, role, FirstName, LastName } = req.body;
  let userRecord: UserRecord | null = null;

  try {
    // Create user in Firebase
    userRecord = await auth.createUser({
      email,
      password,
    });

    await setUserRole(userRecord.uid, role as UserRole);

    // Prepare user data for MongoDB (exclude password)
    const newUser = {
      uid: userRecord.uid,
      email,
      FirstName,
      LastName,
      role,
    };

    // Insert user into MongoDB
    await db.collection("users").insertOne(newUser);

    res
      .status(201)
      .json({ message: "User created successfully", user: newUser });
  } catch (error) {
    // Delete the Firebase user if MongoDB insertion fails
    if (error instanceof Error && userRecord) {
      await auth.deleteUser(userRecord.uid);
    }

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
