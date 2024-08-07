import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { connectToDatabase } from "../../../lib/mongodb";
import { compare, hash } from "bcryptjs";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log("Received request:", req.method, req.url);

  if (req.method !== "POST") {
    console.log("Method not allowed:", req.method);
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    console.log("Session:", session ? "exists" : "null");

    if (!session || !session.user || !session.user.email) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const { currentPassword, newPassword } = req.body;
    console.log(
      "Received passwords:",
      currentPassword ? "exists" : "null",
      newPassword ? "exists" : "null"
    );

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const { db } = await connectToDatabase();
    console.log("Connected to database");

    const user = await db
      .collection("users")
      .findOne({ email: session.user.email });
    console.log("User found:", user ? "yes" : "no");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isPasswordValid = await compare(currentPassword, user.password);
    console.log("Password valid:", isPasswordValid);

    if (!isPasswordValid) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    const hashedNewPassword = await hash(newPassword, 12);

    await db
      .collection("users")
      .updateOne(
        { email: session.user.email },
        { $set: { password: hashedNewPassword } }
      );
    console.log("Password updated successfully");

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
