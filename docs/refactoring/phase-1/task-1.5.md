# Task 1.5: Update Recipe API Endpoints

## Goal
Refactor the Recipe API endpoints to use the new standardized RecipeRepository instead of direct MongoDB access, improving separation of concerns and code maintainability.

## Background
The current Recipe API endpoints directly interact with the MongoDB collection, which tightly couples the API layer with the database implementation. By using the newly created RecipeRepository, we can improve separation of concerns and make the API layer more maintainable and testable.

## Implementation Steps

1. Update the Recipe Service to use the new repository:
   ```typescript
   // services/recipeService.ts
   
   import { Recipe } from "@/types/Recipe";
   import { BaseRepository } from "../repositories/base/BaseRepository";
   import { getRecipeRepository } from "../repositories/recipeRepository";
   import { ValidationError } from "../errors/ValidationError";
   import { NotFoundError } from "../errors/NotFoundError";
   import { ListResult, QueryOptions } from "../repositories/base/types";
   
   export class RecipeService {
     private repository: BaseRepository<Recipe>;
     
     constructor(repository: BaseRepository<Recipe>) {
       this.repository = repository;
     }
     
     async getAllRecipes(options?: QueryOptions): Promise<ListResult<Recipe>> {
       return await this.repository.findAll(options);
     }
     
     async getRecipeById(id: string): Promise<Recipe> {
       const recipe = await this.repository.findById(id);
       if (!recipe) {
         throw new NotFoundError("Recipe not found");
       }
       return recipe;
     }
     
     async searchRecipes(filter: Record<string, any>, options?: QueryOptions): Promise<ListResult<Recipe>> {
       return await this.repository.findByFilter(filter, options);
     }
     
     async createRecipe(recipe: Omit<Recipe, "_id">): Promise<Recipe> {
       this.validateRecipe(recipe);
       return await this.repository.create(recipe);
     }
     
     async createManyRecipes(recipes: Omit<Recipe, "_id">[]): Promise<Recipe[]> {
       // Validate each recipe
       recipes.forEach(recipe => this.validateRecipe(recipe));
       return await this.repository.createMany(recipes);
     }
     
     async updateRecipe(id: string, recipe: Partial<Recipe>): Promise<Recipe> {
       // Validate updated fields
       if (recipe.name !== undefined) {
         this.validateRecipeName(recipe.name);
       }
       
       try {
         return await this.repository.update(id, recipe);
       } catch (error) {
         if (error.message?.includes("not found")) {
           throw new NotFoundError("Recipe not found");
         }
         throw error;
       }
     }
     
     async deleteRecipe(id: string): Promise<void> {
       try {
         await this.repository.delete(id);
       } catch (error) {
         if (error.message?.includes("not found")) {
           throw new NotFoundError("Recipe not found");
         }
         throw error;
       }
     }
     
     private validateRecipe(recipe: Omit<Recipe, "_id">): void {
       this.validateRecipeName(recipe.name);
       
       if (!recipe.ingredients || recipe.ingredients.length === 0) {
         throw new ValidationError("Recipe must have at least one ingredient");
       }
       
       if (!recipe.procedure || recipe.procedure.length === 0) {
         throw new ValidationError("Recipe must have at least one procedure step");
       }
     }
     
     private validateRecipeName(name: string): void {
       if (!name || name.trim().length === 0) {
         throw new ValidationError("Recipe name is required");
       }
       if (name.length > 100) {
         throw new ValidationError("Recipe name must be less than 100 characters");
       }
     }
   }
   
   // Factory function to get the service instance
   let recipeService: RecipeService | null = null;
   
   export async function getRecipeService(): Promise<RecipeService> {
     if (!recipeService) {
       const repository = await getRecipeRepository();
       recipeService = new RecipeService(repository);
     }
     return recipeService;
   }
   ```

2. Update the recipes index endpoint (GET and POST methods):
   ```typescript
   // pages/api/recipes/index.ts
   
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
           // Parse query parameters
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
           
           const result = await recipeService.getAllRecipes(options);
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
   ```

3. Update the recipe ID endpoint (GET, PUT, DELETE methods):
   ```typescript
   // pages/api/recipes/[id].ts
   
   import { NextApiRequest, NextApiResponse } from "next";
   import corsMiddleware, { runMiddleware } from "../../../lib/cors-middleware";
   import { withApiAuth } from "../../../lib/auth-middleware";
   import { Permission } from "../../../types/Permission";
   import { getRecipeService } from "../../../services/recipeService";
   import { ValidationError } from "../../../errors/ValidationError";
   import { NotFoundError } from "../../../errors/NotFoundError";
   
   async function handler(req: NextApiRequest, res: NextApiResponse) {
     await runMiddleware(req, res, corsMiddleware);
     
     const recipeService = await getRecipeService();
     const { id } = req.query;
     
     if (!id || typeof id !== "string") {
       return res.status(400).json({ error: "Recipe ID is required" });
     }
     
     switch (req.method) {
       case "GET":
         try {
           const recipe = await recipeService.getRecipeById(id);
           res.status(200).json(recipe);
         } catch (error) {
           console.error("Failed to fetch recipe:", error);
           
           if (error instanceof NotFoundError) {
             res.status(404).json({ error: error.message });
           } else {
             res.status(500).json({ error: "Failed to fetch recipe" });
           }
         }
         break;
         
       case "PUT":
         try {
           const updatedRecipe = req.body;
           const recipe = await recipeService.updateRecipe(id, updatedRecipe);
           res.status(200).json(recipe);
         } catch (error) {
           console.error("Failed to update recipe:", error);
           
           if (error instanceof NotFoundError) {
             res.status(404).json({ error: error.message });
           } else if (error instanceof ValidationError) {
             res.status(400).json({ error: error.message });
           } else {
             res.status(500).json({ error: "Failed to update recipe" });
           }
         }
         break;
         
       case "DELETE":
         try {
           await recipeService.deleteRecipe(id);
           res.status(204).end();
         } catch (error) {
           console.error("Failed to delete recipe:", error);
           
           if (error instanceof NotFoundError) {
             res.status(404).json({ error: error.message });
           } else {
             res.status(500).json({ error: "Failed to delete recipe" });
           }
         }
         break;
         
       default:
         res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
         res.status(405).end(`Method ${req.method} Not Allowed`);
     }
   }
   
   export default withApiAuth(handler, Permission.VIEW_RECIPES);
   ```

4. Update the batch archive endpoint:
   ```typescript
   // pages/api/recipes/batch-archive.ts
   
   import { NextApiRequest, NextApiResponse } from "next";
   import corsMiddleware, { runMiddleware } from "../../../lib/cors-middleware";
   import { withApiAuth } from "../../../lib/auth-middleware";
   import { Permission } from "../../../types/Permission";
   import { getRecipeService } from "../../../services/recipeService";
   import { getArchiveRepository } from "../../../repositories/archiveRepository";
   import { ObjectId } from "mongodb";
   
   async function handler(req: NextApiRequest, res: NextApiResponse) {
     await runMiddleware(req, res, corsMiddleware);
     
     if (req.method !== "POST") {
       res.setHeader("Allow", ["POST"]);
       return res.status(405).end(`Method ${req.method} Not Allowed`);
     }
     
     try {
       const { recipeIds, archiveId } = req.body;
       
       if (!recipeIds || !Array.isArray(recipeIds) || recipeIds.length === 0) {
         return res.status(400).json({ error: "Recipe IDs are required" });
       }
       
       if (!archiveId) {
         return res.status(400).json({ error: "Archive ID is required" });
       }
       
       const recipeService = await getRecipeService();
       const archiveRepository = await getArchiveRepository();
       
       // Check if archive exists
       const archiveExists = await archiveRepository.exists(archiveId);
       if (!archiveExists) {
         return res.status(404).json({ error: "Archive not found" });
       }
       
       const now = new Date();
       const archive = await archiveRepository.findById(archiveId);
       
       // Process each recipe
       for (const recipeId of recipeIds) {
         try {
           // Get the recipe
           const recipe = await recipeService.getRecipeById(recipeId);
           
           // Add recipe to archive
           await archiveRepository.addRecipe(archiveId, {
             ...recipe,
             originalId: recipeId,
             archivedDate: now
           });
           
           // Update the recipe with archive information
           await recipeService.updateRecipe(recipeId, {
             archiveId: new ObjectId(archiveId),
             archiveDate: now
           });
         } catch (error) {
           console.error(`Failed to archive recipe ${recipeId}:`, error);
           // Continue with other recipes even if one fails
         }
       }
       
       res.status(200).json({ 
         message: "Recipes archived successfully",
         archiveId
       });
     } catch (error) {
       console.error("Failed to batch archive recipes:", error);
       res.status(500).json({ error: "Failed to batch archive recipes" });
     }
   }
   
   export default withApiAuth(handler, Permission.ARCHIVE_RECIPES);
   ```

5. Update the archive endpoint for a single recipe:
   ```typescript
   // pages/api/recipes/[id]/archive.ts
   
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
   
   export default withApiAuth(handler, Permission.ARCHIVE_RECIPES);
   ```

6. Update the restore endpoint:
   ```typescript
   // pages/api/recipes/restore.ts
   
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
     
     try {
       const { recipeIds } = req.body;
       
       if (!recipeIds || !Array.isArray(recipeIds) || recipeIds.length === 0) {
         return res.status(400).json({ error: "Recipe IDs are required" });
       }
       
       const recipeService = await getRecipeService();
       const results = [];
       
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
         }
       }
       
       res.status(200).json({ 
         message: "Recipes restored",
         results
       });
     } catch (error) {
       console.error("Failed to restore recipes:", error);
       res.status(500).json({ error: "Failed to restore recipes" });
     }
   }
   
   export default withApiAuth(handler, Permission.ARCHIVE_RECIPES);
   ```

7. Update the import endpoint:
   ```typescript
   // pages/api/recipes/import.ts
   
   import { NextApiRequest, NextApiResponse } from "next";
   import corsMiddleware, { runMiddleware } from "../../../lib/cors-middleware";
   import { withApiAuth } from "../../../lib/auth-middleware";
   import { Permission } from "../../../types/Permission";
   import { getRecipeService } from "../../../services/recipeService";
   import { recipeImportService } from "../../../services/recipeImportService";
   import { ValidationError } from "../../../errors/ValidationError";
   
   async function handler(req: NextApiRequest, res: NextApiResponse) {
     await runMiddleware(req, res, corsMiddleware);
     
     if (req.method !== "POST") {
       res.setHeader("Allow", ["POST"]);
       return res.status(405).end(`Method ${req.method} Not Allowed`);
     }
     
     try {
       const { data, format } = req.body;
       
       if (!data) {
         return res.status(400).json({ error: "Import data is required" });
       }
       
       if (!format) {
         return res.status(400).json({ error: "Import format is required" });
       }
       
       const recipeService = await getRecipeService();
       
       // Parse and validate the import data
       const recipes = await recipeImportService.parseImportData(data, format);
       
       // Create the recipes in the database
       const importedRecipes = await recipeService.createManyRecipes(recipes);
       
       res.status(200).json({ 
         message: "Recipes imported successfully", 
         count: importedRecipes.length,
         recipes: importedRecipes
       });
     } catch (error) {
       console.error("Failed to import recipes:", error);
       
       if (error instanceof ValidationError) {
         res.status(400).json({ error: error.message });
       } else {
         res.status(500).json({ error: "Failed to import recipes" });
       }
     }
   }
   
   export default withApiAuth(handler, Permission.CREATE_RECIPES);
   ```

8. Create unit tests for the recipe API endpoints in `__tests__/pages/api/recipes`.

## Files to Create/Modify
- `services/recipeService.ts` (uncomment and update)
- `pages/api/recipes/index.ts` (update)
- `pages/api/recipes/[id].ts` (update)
- `pages/api/recipes/[id]/archive.ts` (update)
- `pages/api/recipes/batch-archive.ts` (update)
- `pages/api/recipes/restore.ts` (update)
- `pages/api/recipes/import.ts` (update)
- `__tests__/pages/api/recipes/*.test.ts` (update or create)

## Verification Steps
1. Run TypeScript compiler to ensure no type errors
2. Run unit tests for the recipe API endpoints
3. Test each endpoint manually to verify correct behavior:
   - GET /api/recipes (with pagination)
   - POST /api/recipes
   - GET /api/recipes/[id]
   - PUT /api/recipes/[id]
   - DELETE /api/recipes/[id]
   - POST /api/recipes/[id]/archive
   - POST /api/recipes/batch-archive
   - POST /api/recipes/restore
   - POST /api/recipes/import
4. Verify compatibility with frontend components

## Dependencies
- Task 1.1: Create Base Repository Interface (completed)
- Task 1.2: Implement Recipe Repository (to be completed)
- Task 1.4: Add Archive Repository (to be completed)

## Estimated Effort
Medium-Large (5-6 hours)

## Notes
- Ensure proper error handling and validation
- Support pagination in list endpoints
- Maintain compatibility with existing frontend code
- Consider adding query filters beyond basic pagination
- Ensure proper separation of concerns between API handlers and service layer
- Handle ObjectId conversions within the repository layer, not in API endpoints