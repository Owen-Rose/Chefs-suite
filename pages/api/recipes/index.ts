// /pages/api/recipes/index.ts
import { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "../../../lib/mongodb";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { db } = await connectToDatabase();

  switch (req.method) {
    case "GET":
      try {
        const recipes = await db.collection("recipes").find({}).toArray();
        res.status(200).json(recipes);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch recipes" });
      }
      break;
    case "POST":
      try {
        const newRecipe = req.body;
        const result = await db.collection("recipes").insertOne(newRecipe);
        res.status(201).json(result.ops[0]);
      } catch (error) {
        res.status(500).json({ error: "Failed to create recipe" });
      }
      break;
    default:
      res.setHeader("Allow", ["GET", "POST"]);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
