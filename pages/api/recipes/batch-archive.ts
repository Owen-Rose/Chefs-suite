import { NextApiRequest, NextApiResponse } from "next";
import { ObjectId } from "mongodb";
import corsMiddleware, { runMiddleware } from "../../../lib/cors-middleware";
import { withApiAuth } from "../../../lib/auth-middleware";
import { Permission } from "../../../types/Permission";
import { getRecipeService } from "../../../services/recipeService";
import { getArchiveRepository } from "../../../repositories/archiveRepository";
import { NotFoundError } from "../../../errors/NotFoundError";
import { connectToDatabase } from "../../../lib/mongodb";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await runMiddleware(req, res, corsMiddleware);
  
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
  
  const { recipeIds, archiveId } = req.body;
  
  if (!recipeIds || !Array.isArray(recipeIds) || recipeIds.length === 0) {
    return res.status(400).json({ error: "Recipe IDs are required" });
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
    
    // Check if archive exists
    const archiveExists = await archiveRepository.exists(archiveId);
    if (!archiveExists) {
      return res.status(404).json({ error: "Archive not found" });
    }
    
    // We need database transaction support for batch operations
    const { client } = await connectToDatabase();
    const session = client.startSession();
    
    const results: Array<{id: string, success: boolean, error?: string}> = [];
    let allSuccessful = true;
    
    try {
      await session.withTransaction(async () => {
        const now = new Date();
        
        // Process each recipe
        for (const recipeId of recipeIds) {
          try {
            // Get the recipe
            const recipe = await recipeService.getRecipeById(recipeId);
            
            // Add recipe to archive
            await archiveRepository.addRecipe(
              archiveId,
              {
                ...recipe,
                originalId: recipeId,
                archivedDate: now
              },
              { session }
            );
            
            // Update the recipe with archive information
            await recipeService.updateRecipe(
              recipeId,
              {
                archiveId: new ObjectId(archiveId),
                archiveDate: now
              },
              { session }
            );
            
            results.push({
              id: recipeId,
              success: true
            });
          } catch (error) {
            console.error(`Failed to archive recipe ${recipeId}:`, error);
            
            results.push({
              id: recipeId,
              success: false,
              error: error instanceof NotFoundError ? error.message : "Failed to archive recipe"
            });
            
            allSuccessful = false;
          }
        }
      });
      
      const statusCode = allSuccessful ? 200 : 207; // 207 for partial success
      
      res.status(statusCode).json({
        message: allSuccessful ? "All recipes archived successfully" : "Some recipes could not be archived",
        archiveId,
        results
      });
    } finally {
      await session.endSession();
    }
  } catch (error) {
    console.error("Failed to batch archive recipes:", error);
    res.status(500).json({ error: "Failed to batch archive recipes" });
  }
}

export default withApiAuth(handler, Permission.EDIT_RECIPES);