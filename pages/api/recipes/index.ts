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
        newRecipe._id = new ObjectId(newRecipe._id); // Ensure _id is an ObjectId

        const result = await db.collection("recipes").insertOne(newRecipe);
        const insertedRecipe = await db
          .collection("recipes")
          .findOne({ _id: result.insertedId });
        res.status(201).json(insertedRecipe);
      } catch (error) {
        res.status(500).json({ error: "Failed to create recipe" });
      }
      break;
    default:
      res.setHeader("Allow", ["GET", "POST"]);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
