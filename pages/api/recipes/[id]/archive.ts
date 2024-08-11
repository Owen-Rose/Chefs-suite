import { NextApiRequest, NextApiResponse } from "next";
import { ObjectId } from "mongodb";
import { connectToDatabase } from "../../../../lib/mongodb";
import { withApiAuth } from "../../../../lib/auth-middleware";
import { Permission } from "../../../../types/Permission";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { id } = req.query;
  const { archiveId } = req.body;

  if (!id || !archiveId) {
    return res.status(400).json({ message: "Missing required parameters" });
  }

  try {
    const { db, client } = await connectToDatabase();

    const session = client.startSession();

    try {
      await session.withTransaction(async () => {
        const recipe = await db
          .collection("recipes")
          .findOne({ _id: new ObjectId(id as string) });

        if (!recipe) {
          throw new Error("Recipe not found");
        }

        const { _id, ...recipeWithoutId } = recipe;
        const archivedRecipe = {
          ...recipeWithoutId,
          archivedDate: new Date(),
          originalId: _id,
        };

        await db
          .collection("archives")
          .updateOne(
            { _id: new ObjectId(archiveId) },
            { $push: { recipes: archivedRecipe } as any },
            { session }
          );

        await db
          .collection("recipes")
          .deleteOne({ _id: new ObjectId(id as string) }, { session });
      });

      res.status(200).json({ message: "Recipe archived successfully" });
    } finally {
      await session.endSession();
    }
  } catch (error) {
    console.error("Error archiving recipe:", error);
    res.status(500).json({
      message: "Internal Server Error",
      error: (error as Error).message,
    });
  }
}

export default withApiAuth(handler, Permission.EDIT_RECIPES);
