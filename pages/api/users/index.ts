import { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import { connectToDatabase } from "../../../lib/mongodb";
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

  if (req.method === "POST") {
    // Create user
    const { name, email, password, role } = req.body;
    const hashedPassword = await hash(password, 12);
    const result = await db.collection("users").insertOne({
      name,
      email,
      password: hashedPassword,
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    res
      .status(201)
      .json({ message: "User created", userId: result.insertedId });
  } else if (req.method === "GET") {
    // Get all users
    const users = await db
      .collection("users")
      .find({}, { projection: { password: 0 } })
      .toArray();
    res.status(200).json(users);
  } else {
    res.setHeader("Allow", ["POST", "GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

const handleCreateUser = async (
  req: NextApiRequest,
  res: NextApiResponse,
  db: any
) => {
  const { email, password, role, FirstName, LastName } = req.body;

  try {
    const existingUser = await db.collection("users").findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await hash(password, 12);

    const newUser = {
      email,
      password: hashedPassword,
      FirstName,
      LastName,
      role,
    };

    const result = await db.collection("users").insertOne(newUser);

    res.status(201).json({
      message: "User created successfully",
      user: { ...newUser, _id: result.insertedId },
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "An error occurred while creating the user" });
  }
};

const handleGetUsers = async (
  req: NextApiRequest,
  res: NextApiResponse,
  db: any
) => {
  try {
    const users = await db
      .collection("users")
      .find({}, { projection: { password: 0 } })
      .toArray();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
};
