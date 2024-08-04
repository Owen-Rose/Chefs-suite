import type { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "../../../lib/mongodb";
import { hash } from "bcryptjs";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { email, password, FirstName, LastName, role } = req.body;

    if (!email || !password || !FirstName || !LastName || !role) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const { db } = await connectToDatabase();

    const existingUser = await db.collection("users").findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await hash(password, 12);

    const result = await db.collection("users").insertOne({
      email,
      password: hashedPassword,
      FirstName,
      LastName,
      role,
    });

    res
      .status(201)
      .json({
        message: "User created successfully",
        userId: result.insertedId,
      });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
