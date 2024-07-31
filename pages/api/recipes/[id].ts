import { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "../../../lib/mongodb";
import { ObjectId } from "mongodb";
import corsMiddleware from "../../../lib/cors-middleware";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await corsMiddleware(req, res, () => {});

  const { db } = await connectToDatabase();
  const { id } = req.query;

  try {
    if (!ObjectId.isValid(id as string)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    switch (req.method) {
      case "GET":
        try {
          const recipe = await db
            .collection("recipes")
            .findOne({ _id: new ObjectId(id as string) });
          if (!recipe) {
            return res.status(404).json({ error: "Recipe not found" });
          }
          res.status(200).json(recipe);
        } catch (error) {
          console.error("Failed to fetch recipe:", error);
          res.status(500).json({ error: "Failed to fetch recipe" });
        }
        break;
      // ... rest of your code remains the same
    }
  } catch (error) {
    console.error("General error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
