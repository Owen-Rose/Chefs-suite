import { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "../../../lib/mongodb";
import { hash } from "bcryptjs";
import { withApiAuth } from "../../../lib/auth-middleware";
import { Permission } from "../../../types/Permission";
import { UserRole } from "../../../types/Roles";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { db } = await connectToDatabase();

  switch (req.method) {
    case "GET":
      return withApiAuth(getUsers, Permission.VIEW_USERS)(req, res);
    case "POST":
      return withApiAuth(createUser, Permission.CREATE_USERS)(req, res);
    default:
      res.setHeader("Allow", ["GET", "POST"]);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

async function getUsers(req: NextApiRequest, res: NextApiResponse) {
  const { db } = await connectToDatabase();
  try {
    const users = await db
      .collection("users")
      .find({}, { projection: { password: 0 } })
      .toArray();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
}

async function createUser(req: NextApiRequest, res: NextApiResponse) {
  const { db } = await connectToDatabase();
  try {
    const { email, password, FirstName, LastName, role } = req.body;

    if (!email || !password || !FirstName || !LastName || !role) {
      return res.status(400).json({ error: "Missing required fields" });
    }

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
      role: role as UserRole,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("users").insertOne(newUser);

    res.status(201).json({
      message: "User created successfully",
      user: { ...newUser, _id: result.insertedId, password: undefined },
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to create user" });
  }
}

export default handler;