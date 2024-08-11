import { NextApiRequest, NextApiResponse } from "next";
import { ObjectId } from "mongodb";
import { connectToDatabase } from "../../../lib/mongodb";
import { withApiAuth } from "../../../lib/auth-middleware";
import { Permission } from "../../../types/Permission";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { recipeIds, archiveId } = req.body;

  if (!recipeIds || !archiveId) {
    return res.status(400).json({ message: "Missing required parameters" });
  }

  try {
    const { db, client } = await connectToDatabase();

    const session = client.startSession();

    try {
      await session.withTransaction(async () => {
        const archive = await db
          .collection("archives")
          .findOne({ _id: new ObjectId(archiveId) });

        if (!archive) {
          throw new Error("Archive not found");
        }

        const recipesToRestore = archive.recipes.filter((recipe: any) =>
          recipeIds.includes(recipe.originalId.toString())
        );

        await db.collection("recipes").insertMany(
          recipesToRestore.map((recipe: any) => {
            const { archivedDate, originalId, ...restOfRecipe } = recipe;
            return { ...restOfRecipe, _id: originalId };
          }),
          { session }
        );

        await db.collection("archives").updateOne(
          { _id: new ObjectId(archiveId) },
          {
            $pull: {
              recipes: {
                originalId: {
                  $in: recipeIds.map((id: string) => new ObjectId(id)),
                },
              },
            } as any,
          },
          { session }
        );
      });

      res.status(200).json({ message: "Recipes restored successfully" });
    } finally {
      await session.endSession();
    }
  } catch (error) {
    console.error("Error restoring recipes:", error);
    res.status(500).json({
      message: "Internal Server Error",
      error: (error as Error).message,
    });
  }
}

export default withApiAuth(handler, Permission.EDIT_RECIPES);
