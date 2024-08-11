import { NextApiRequest, NextApiResponse } from "next";
import { ObjectId } from "mongodb";
import { connectToDatabase } from "../../../lib/mongodb";
import {
  withApiAuth,
  ExtendedNextApiRequest,
} from "../../../lib/auth-middleware";
import { Permission } from "../../../types/Permission";
import { UserRole } from "../../../types/Roles";

async function handler(req: ExtendedNextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { recipeIds, archiveId } = req.body;

  if (
    !recipeIds ||
    !Array.isArray(recipeIds) ||
    recipeIds.length === 0 ||
    !archiveId
  ) {
    return res.status(400).json({ message: "Invalid request parameters" });
  }

  try {
    const { db, client } = await connectToDatabase();

    const session = client.startSession();

    try {
      await session.withTransaction(async () => {
        const recipes = await db
          .collection("recipes")
          .find({ _id: { $in: recipeIds.map((id) => new ObjectId(id)) } })
          .toArray();

        if (recipes.length !== recipeIds.length) {
          throw new Error("One or more recipes not found");
        }

        const archivedRecipes = recipes.map((recipe) => {
          const { _id, ...recipeWithoutId } = recipe;
          return {
            ...recipeWithoutId,
            archivedDate: new Date(),
            originalId: _id,
          };
        });

        await db
          .collection("archives")
          .updateOne(
            { _id: new ObjectId(archiveId) },
            { $push: { recipes: { $each: archivedRecipes } } } as any,
            { session }
          );

        await db
          .collection("recipes")
          .deleteMany(
            { _id: { $in: recipeIds.map((id) => new ObjectId(id)) } },
            { session }
          );
      });

      res.status(200).json({ message: "Recipes archived successfully" });
    } finally {
      await session.endSession();
    }
  } catch (error) {
    console.error("Error archiving recipes:", error);
    res.status(500).json({
      message: "Internal Server Error",
      error: (error as Error).message,
    });
  }
}

// Only allow ADMIN, CHEF, and MANAGER roles to access this endpoint

export default withApiAuth(handler, Permission.EDIT_RECIPES);
