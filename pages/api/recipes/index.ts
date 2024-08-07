import { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "../../../lib/mongodb";
import { ObjectId } from "mongodb";
import corsMiddleware, { runMiddleware } from "../../../lib/cors-middleware";
import { withApiAuth } from "../../../lib/auth-middleware";
import { Permission } from "../../../types/Permission";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await runMiddleware(req, res, corsMiddleware);

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
        newRecipe._id = new ObjectId(newRecipe._id);

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

export default withApiAuth(handler, Permission.VIEW_RECIPES);