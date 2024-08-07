import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { connectToDatabase } from "../../../lib/mongodb";
import { ObjectId } from "mongodb";
import { Permission, hasPermission } from "../../../types/Permission";
import { UserRole } from "../../../types/Roles";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const { method } = req;
  const { id } = req.query;

  const { db } = await connectToDatabase();

  switch (method) {
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
    case "PUT":
      if (!hasPermission(session.user.role, Permission.EDIT_RECIPES)) {
        return res
          .status(403)
          .json({ error: "Not authorized to edit recipes" });
      }
      try {
        const updatedRecipe = req.body;
        delete updatedRecipe._id;
        const result = await db
          .collection("recipes")
          .updateOne(
            { _id: new ObjectId(id as string) },
            { $set: updatedRecipe }
          );
        if (result.matchedCount === 0) {
          return res.status(404).json({ error: "Recipe not found" });
        }
        res.status(200).json({ message: "Recipe updated successfully" });
      } catch (error) {
        console.error("Failed to update recipe:", error);
        res.status(500).json({ error: "Failed to update recipe" });
      }
      break;
    case "DELETE":
      if (!hasPermission(session.user.role, Permission.DELETE_RECIPES)) {
        return res
          .status(403)
          .json({ error: "Not authorized to delete recipes" });
      }
      try {
        const result = await db
          .collection("recipes")
          .deleteOne({ _id: new ObjectId(id as string) });
        if (result.deletedCount === 0) {
          return res.status(404).json({ error: "Recipe not found" });
        }
        res.status(200).json({ message: "Recipe deleted successfully" });
      } catch (error) {
        res.status(500).json({ error: "Failed to delete recipe" });
      }
      break;
    default:
      res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
