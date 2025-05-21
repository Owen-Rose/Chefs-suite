import { NextApiRequest, NextApiResponse } from "next";
import corsMiddleware, { runMiddleware } from "../../../../lib/cors-middleware";
import { withApiAuth } from "../../../../lib/auth-middleware";
import { Permission } from "../../../../types/Permission";
import { getRecipeService } from "../../../../services/recipeService";
import { getArchiveRepository } from "../../../../repositories/archiveRepository";
import { NotFoundError } from "../../../../errors/NotFoundError";
import { ObjectId } from "mongodb";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await runMiddleware(req, res, corsMiddleware);
  
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
  
  const { id } = req.query;
  const { archiveId } = req.body;
  
  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Recipe ID is required" });
  }
  
  if (!archiveId) {
    return res.status(400).json({ error: "Archive ID is required" });
  }
  
  if (!ObjectId.isValid(archiveId)) {
    return res.status(400).json({ error: "Invalid archive ID" });
  }
  
  try {
    const recipeService = await getRecipeService();
    const archiveRepository = await getArchiveRepository();
    
    // Check if recipe exists
    const recipe = await recipeService.getRecipeById(id);
    
    // Check if archive exists
    const archiveExists = await archiveRepository.exists(archiveId);
    if (!archiveExists) {
      return res.status(404).json({ error: "Archive not found" });
    }
    
    const now = new Date();
    
    // Add recipe to archive
    await archiveRepository.addRecipe(archiveId, {
      ...recipe,
      originalId: id,
      archivedDate: now
    });
    
    // Update the recipe with archive information
    const updatedRecipe = await recipeService.updateRecipe(id, {
      archiveId: new ObjectId(archiveId),
      archiveDate: now
    });
    
    res.status(200).json(updatedRecipe);
  } catch (error) {
    console.error("Failed to archive recipe:", error);
    
    if (error instanceof NotFoundError) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Failed to archive recipe" });
    }
  }
}

export default withApiAuth(handler, Permission.EDIT_RECIPES);