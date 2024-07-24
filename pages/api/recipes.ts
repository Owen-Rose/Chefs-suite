import { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "../../lib/mongodb";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    console.log("Connecting to MongoDB...");
    const { db } = await connectToDatabase();
    console.log("Connected to MongoDB");

    const recipes = await db.collection("recipes").find({}).toArray();
    console.log("Fetched recipes:", recipes);

    res.status(200).json(recipes);
  } catch (error) {
    console.error("Error fetching recipes:", error);
    res.status(500).json({ error: "Failed to fetch recipes" });
  }
}
