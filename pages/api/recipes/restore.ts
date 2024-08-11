import { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "../../../lib/mongodb";
import { ObjectId } from "mongodb";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
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
    return res.status(400).json({ message: "Missing required parameters" });
  }

  try {
    const { db } = await connectToDatabase();
    const archivesCollection = db.collection("archives");
    const recipesCollection = db.collection("recipes");

    // Find the archive
    const archive = await archivesCollection.findOne({
      _id: new ObjectId(archiveId),
    });
    if (!archive) {
      return res.status(404).json({ message: "Archive not found" });
    }

    // Filter out the recipes to be restored
    const recipesToRestore = archive.recipes.filter((recipe: any) =>
      recipeIds.includes(recipe.originalId.toString())
    );

    if (recipesToRestore.length === 0) {
      return res
        .status(400)
        .json({ message: "No matching recipes found to restore" });
    }

    // Restore the recipes to the main collection
    const restoreOperations = recipesToRestore.map((recipe: any) => {
      const { archivedDate, archiveId, ...restOfRecipe } = recipe;
      return {
        replaceOne: {
          filter: { _id: recipe.originalId },
          replacement: { ...restOfRecipe, _id: recipe.originalId },
          upsert: true,
        },
      };
    });

    await recipesCollection.bulkWrite(restoreOperations);

    // Remove the restored recipes from the archive
    await archivesCollection.updateOne({ _id: new ObjectId(archiveId) }, {
      $pull: {
        recipes: {
          originalId: {
            $in: recipeIds.map((id: string) => new ObjectId(id)),
          },
        },
      },
    } as any);

    res.status(200).json({
      message: `Successfully restored ${recipesToRestore.length} recipes`,
    });
  } catch (error) {
    console.error("Error restoring recipes:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
