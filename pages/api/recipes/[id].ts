// /pages/api/recipes/[id].ts
import { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "../../../lib/mongodb";
import { ObjectId } from "mongodb";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { db } = await connectToDatabase();
  const { id } = req.query;

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
        res.status(500).json({ error: "Failed to fetch recipe" });
      }
      break;
    case "PUT":
      try {
        const updatedRecipe = req.body;
        await db
          .collection("recipes")
          .updateOne(
            { _id: new ObjectId(id as string) },
            { $set: updatedRecipe }
          );
        res.status(200).json({ message: "Recipe updated successfully" });
      } catch (error) {
        res.status(500).json({ error: "Failed to update recipe" });
      }
      break;
    case "DELETE":
      try {
        await db
          .collection("recipes")
          .deleteOne({ _id: new ObjectId(id as string) });
        res.status(200).json({ message: "Recipe deleted successfully" });
      } catch (error) {
        res.status(500).json({ error: "Failed to delete recipe" });
      }
      break;
    default:
      res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
