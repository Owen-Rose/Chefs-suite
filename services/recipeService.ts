import { Recipe } from "@/types/Recipe";
import { BaseRepository } from "../repositories/base/BaseRepository";
import { getRecipeRepository, getMongoRecipeRepository } from "../repositories/recipeRepository";
import { ValidationError } from "../errors/ValidationError";
import { NotFoundError } from "../errors/NotFoundError";
import { ListResult, QueryOptions, TransactionContext } from "../repositories/base/types";
import { Logger } from "../utils/logger";
import { ensureServicesInitialized, getService, ServiceTokens } from "@/lib/services";

/**
 * Service class for recipe-related operations
 * Provides a layer of business logic and validation over the repository
 */
export class RecipeService {
  private repository: BaseRepository<Recipe>;
  
  /**
   * Create a new RecipeService instance
   * 
   * @param repository - The repository implementation to use
   */
  constructor(repository: BaseRepository<Recipe>) {
    this.repository = repository;
  }
  
  /**
   * Get all recipes with pagination support
   * 
   * @param options - Query options for pagination and sorting
   * @param txContext - Optional transaction context
   * @returns A paginated list of recipes
   */
  async getAllRecipes(options?: QueryOptions, txContext?: TransactionContext): Promise<ListResult<Recipe>> {
    try {
      return await this.repository.findAll(options, txContext);
    } catch (error) {
      Logger.error('Error fetching all recipes:', { error });
      throw error;
    }
  }
  
  /**
   * Get a recipe by its ID
   * 
   * @param id - The recipe ID
   * @param txContext - Optional transaction context
   * @returns The recipe if found
   * @throws NotFoundError if recipe doesn't exist
   */
  async getRecipeById(id: string, txContext?: TransactionContext): Promise<Recipe> {
    try {
      const recipe = await this.repository.findById(id, txContext);
      if (!recipe) {
        throw new NotFoundError("Recipe not found");
      }
      return recipe;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      Logger.error('Error fetching recipe by ID:', { id, error });
      throw error;
    }
  }
  
  /**
   * Search recipes by filter criteria
   * 
   * @param filter - Filter criteria
   * @param options - Query options for pagination and sorting
   * @param txContext - Optional transaction context
   * @returns A paginated list of recipes matching the filter
   */
  async searchRecipes(filter: Record<string, any>, options?: QueryOptions, txContext?: TransactionContext): Promise<ListResult<Recipe>> {
    try {
      return await this.repository.findByFilter(filter, options, txContext);
    } catch (error) {
      Logger.error('Error searching recipes:', { filter, error });
      throw error;
    }
  }
  
  /**
   * Create a new recipe
   * 
   * @param recipe - The recipe data
   * @param txContext - Optional transaction context
   * @returns The created recipe
   * @throws ValidationError if recipe data is invalid
   */
  async createRecipe(recipe: Omit<Recipe, "_id">, txContext?: TransactionContext): Promise<Recipe> {
    try {
      this.validateRecipe(recipe);
      return await this.repository.create(recipe, txContext);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      Logger.error('Error creating recipe:', { error });
      throw error;
    }
  }
  
  /**
   * Create multiple recipes
   * 
   * @param recipes - Array of recipe data
   * @param txContext - Optional transaction context
   * @returns Array of created recipes
   * @throws ValidationError if any recipe data is invalid
   */
  async createManyRecipes(recipes: Omit<Recipe, "_id">[], txContext?: TransactionContext): Promise<Recipe[]> {
    try {
      // Validate each recipe
      recipes.forEach(recipe => this.validateRecipe(recipe));
      return await this.repository.createMany(recipes, txContext);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      Logger.error('Error creating multiple recipes:', { error });
      throw error;
    }
  }
  
  /**
   * Update an existing recipe
   * 
   * @param id - The recipe ID
   * @param recipe - Partial recipe data to update
   * @param txContext - Optional transaction context
   * @returns The updated recipe
   * @throws ValidationError if recipe data is invalid
   * @throws NotFoundError if recipe doesn't exist
   */
  async updateRecipe(id: string, recipe: Partial<Recipe>, txContext?: TransactionContext): Promise<Recipe> {
    try {
      // Validate updated fields
      if (recipe.name !== undefined) {
        this.validateRecipeName(recipe.name);
      }
      
      return await this.repository.update(id, recipe, txContext);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      if (error instanceof Error && error.message.includes("not found")) {
        throw new NotFoundError("Recipe not found");
      }
      Logger.error('Error updating recipe:', { id, error });
      throw error;
    }
  }
  
  /**
   * Delete a recipe
   * 
   * @param id - The recipe ID
   * @param txContext - Optional transaction context
   * @throws NotFoundError if recipe doesn't exist
   */
  async deleteRecipe(id: string, txContext?: TransactionContext): Promise<void> {
    try {
      await this.repository.delete(id, txContext);
    } catch (error) {
      if (error instanceof Error && error.message.includes("not found")) {
        throw new NotFoundError("Recipe not found");
      }
      Logger.error('Error deleting recipe:', { id, error });
      throw error;
    }
  }
  
  /**
   * Find recipes by ingredient name
   * 
   * @param ingredientName - The ingredient name to search for
   * @param options - Query options for pagination and sorting
   * @param txContext - Optional transaction context
   * @returns A paginated list of recipes containing the ingredient
   */
  async findByIngredient(
    ingredientName: string,
    options?: QueryOptions,
    txContext?: TransactionContext
  ): Promise<ListResult<Recipe>> {
    try {
      const mongoRepo = await getMongoRecipeRepository();
      return await mongoRepo.findByIngredient(ingredientName, options, txContext);
    } catch (error) {
      Logger.error('Error finding recipes by ingredient:', { ingredientName, error });
      throw error;
    }
  }
  
  /**
   * Find recipes by station
   * 
   * @param station - The station to search for
   * @param options - Query options for pagination and sorting
   * @param txContext - Optional transaction context
   * @returns A paginated list of recipes for the specified station
   */
  async findByStation(
    station: string,
    options?: QueryOptions,
    txContext?: TransactionContext
  ): Promise<ListResult<Recipe>> {
    try {
      const mongoRepo = await getMongoRecipeRepository();
      return await mongoRepo.findByStation(station, options, txContext);
    } catch (error) {
      Logger.error('Error finding recipes by station:', { station, error });
      throw error;
    }
  }
  
  /**
   * Validate a complete recipe
   * 
   * @param recipe - The recipe to validate
   * @throws ValidationError if validation fails
   */
  private validateRecipe(recipe: Omit<Recipe, "_id">): void {
    this.validateRecipeName(recipe.name);
    
    if (!recipe.ingredients || recipe.ingredients.length === 0) {
      throw new ValidationError("Recipe must have at least one ingredient");
    }
    
    if (!recipe.procedure || recipe.procedure.length === 0) {
      throw new ValidationError("Recipe must have at least one procedure step");
    }
  }
  
  /**
   * Validate a recipe name
   * 
   * @param name - The recipe name to validate
   * @throws ValidationError if validation fails
   */
  private validateRecipeName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new ValidationError("Recipe name is required");
    }
    if (name.length > 100) {
      throw new ValidationError("Recipe name must be less than 100 characters");
    }
  }
}

// Singleton instance of the recipe service
let recipeService: RecipeService | null = null;

/**
 * Get or create the recipe service instance
 * 
 * @returns A promise resolving to the recipe service
 */
export async function getRecipeService(): Promise<RecipeService> {
  // Try the DI container first
  try {
    await ensureServicesInitialized();
    return getService(ServiceTokens.RecipeService);
  } catch (error) {
    // Fall back to the legacy method
    if (!recipeService) {
      const repository = await getRecipeRepository();
      recipeService = new RecipeService(repository);
    }
    return recipeService;
  }
}