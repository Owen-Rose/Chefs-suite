import { NextApiRequest, NextApiResponse } from "next";
import corsMiddleware, { runMiddleware } from "../../../lib/cors-middleware";
import { withApiAuth } from "../../../lib/auth-middleware";
import { Permission } from "../../../types/Permission";
import { getRecipeService } from "../../../services/recipeService";
import { NotFoundError } from "../../../errors/NotFoundError";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await runMiddleware(req, res, corsMiddleware);
  
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
  
  const { recipeIds } = req.body;
  
  if (!recipeIds || !Array.isArray(recipeIds) || recipeIds.length === 0) {
    return res.status(400).json({ error: "Recipe IDs are required" });
  }
  
  try {
    const recipeService = await getRecipeService();
    const results = [];
    let allSuccessful = true;
    
    // Process each recipe
    for (const recipeId of recipeIds) {
      try {
        // Update the recipe to remove archive information
        const updatedRecipe = await recipeService.updateRecipe(recipeId, {
          archiveId: null,
          archiveDate: null
        });
        
        results.push({ id: recipeId, success: true, recipe: updatedRecipe });
      } catch (error) {
        console.error(`Failed to restore recipe ${recipeId}:`, error);
        
        results.push({ 
          id: recipeId, 
          success: false, 
          error: error instanceof NotFoundError ? "Recipe not found" : "Failed to restore recipe" 
        });
        
        allSuccessful = false;
      }
    }
    
    const statusCode = allSuccessful ? 200 : 207; // 207 for partial success
    
    res.status(statusCode).json({ 
      message: allSuccessful ? "All recipes restored successfully" : "Some recipes could not be restored",
      results
    });
  } catch (error) {
    console.error("Failed to restore recipes:", error);
    res.status(500).json({ error: "Failed to restore recipes" });
  }
}

export default withApiAuth(handler, Permission.EDIT_RECIPES);