import { NextApiRequest, NextApiResponse } from "next";
import corsMiddleware, { runMiddleware } from "../../../lib/cors-middleware";
import { withApiAuth } from "../../../lib/auth-middleware";
import { Permission } from "../../../types/Permission";
import { getRecipeService } from "../../../services/recipeService";
import { ValidationError } from "../../../errors/ValidationError";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await runMiddleware(req, res, corsMiddleware);
  
  const recipeService = await getRecipeService();
  
  switch (req.method) {
    case "GET":
      try {
        // Parse query parameters for pagination
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const sortField = req.query.sortBy as string || "createdDate";
        const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
        
        // Create query options
        const options = {
          skip: (page - 1) * limit,
          limit,
          sort: { [sortField]: sortOrder } as Record<string, 1 | -1>
        };
        
        // Apply filter if provided
        let filter = {};
        if (req.query.filter) {
          try {
            filter = JSON.parse(req.query.filter as string);
          } catch (e) {
            // Invalid filter format, using empty filter
          }
        }
        
        const result = await recipeService.searchRecipes(filter, options);
        res.status(200).json(result);
      } catch (error) {
        console.error("Failed to fetch recipes:", error);
        res.status(500).json({ error: "Failed to fetch recipes" });
      }
      break;
      
    case "POST":
      try {
        const newRecipe = req.body;
        const recipe = await recipeService.createRecipe(newRecipe);
        res.status(201).json(recipe);
      } catch (error) {
        console.error("Failed to create recipe:", error);
        
        if (error instanceof ValidationError) {
          res.status(400).json({ error: error.message });
        } else {
          res.status(500).json({ error: "Failed to create recipe" });
        }
      }
      break;
      
    default:
      res.setHeader("Allow", ["GET", "POST"]);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

export default withApiAuth(handler, Permission.VIEW_RECIPES);