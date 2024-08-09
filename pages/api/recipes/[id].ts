import { NextApiResponse } from "next";
import { ObjectId } from "mongodb";
import { connectToDatabase } from "../../../lib/mongodb";
import {
  withApiAuth,
  ExtendedNextApiRequest,
} from "../../../lib/auth-middleware";
import { Permission } from "../../../types/Permission";

async function handler(req: ExtendedNextApiRequest, res: NextApiResponse) {
  const { method } = req;
  const { id } = req.query;

  if (!ObjectId.isValid(id as string)) {
    return res.status(400).json({ error: "Invalid recipe ID" });
  }

  switch (method) {
    case "GET":
      return withApiAuth(getRecipe, Permission.VIEW_RECIPES)(req, res);
    case "PUT":
      return withApiAuth(updateRecipe, Permission.EDIT_RECIPES)(req, res);
    case "DELETE":
      return withApiAuth(deleteRecipe, Permission.DELETE_RECIPES)(req, res);
    case "POST":
      if (req.body.action === "archive") {
        return withApiAuth(archiveRecipe, Permission.EDIT_RECIPES)(req, res);
      } else if (req.body.action === "unarchive") {
        return withApiAuth(unarchiveRecipe, Permission.EDIT_RECIPES)(req, res);
      }
      res.status(400).json({ error: "Invalid action" });
      break;
    default:
      res.setHeader("Allow", ["GET", "PUT", "DELETE", "POST"]);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}

async function getRecipe(req: ExtendedNextApiRequest, res: NextApiResponse) {
  const { recipes } = await connectToDatabase();
  const { id } = req.query;

  try {
    const recipe = await recipes.findOne({ _id: new ObjectId(id as string) });
    if (!recipe) {
      return res.status(404).json({ error: "Recipe not found" });
    }
    res.status(200).json(recipe);
  } catch (error) {
    console.error("Failed to fetch recipe:", error);
    res.status(500).json({ error: "Failed to fetch recipe" });
  }
}

async function updateRecipe(req: ExtendedNextApiRequest, res: NextApiResponse) {
  const { recipes } = await connectToDatabase();
  const { id } = req.query;

  try {
    const updatedRecipe = req.body;
    delete updatedRecipe._id;
    const result = await recipes.updateOne(
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
}

async function deleteRecipe(req: ExtendedNextApiRequest, res: NextApiResponse) {
  const { recipes } = await connectToDatabase();
  const { id } = req.query;

  try {
    const result = await recipes.deleteOne({ _id: new ObjectId(id as string) });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Recipe not found" });
    }
    res.status(200).json({ message: "Recipe deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete recipe" });
  }
}

async function archiveRecipe(
  req: ExtendedNextApiRequest,
  res: NextApiResponse
) {
  const { recipes, archives } = await connectToDatabase();
  const { id } = req.query;
  const { archiveId } = req.body;

  if (!ObjectId.isValid(archiveId)) {
    return res.status(400).json({ error: "Invalid archive ID" });
  }

  try {
    const archive = await archives.findOne({ _id: new ObjectId(archiveId) });
    if (!archive) {
      return res.status(404).json({ error: "Archive not found" });
    }

    const result = await recipes.updateOne(
      { _id: new ObjectId(id as string) },
      {
        $set: {
          archiveId: new ObjectId(archiveId),
          archivedDate: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Recipe not found" });
    }

    res.status(200).json({ message: "Recipe archived successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to archive recipe" });
  }
}

async function unarchiveRecipe(
  req: ExtendedNextApiRequest,
  res: NextApiResponse
) {
  const { recipes } = await connectToDatabase();
  const { id } = req.query;

  try {
    const result = await recipes.updateOne(
      { _id: new ObjectId(id as string) },
      { $set: { archiveId: null, archivedDate: null } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Recipe not found" });
    }

    res.status(200).json({ message: "Recipe unarchived successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to unarchive recipe" });
  }
}

export default handler;
