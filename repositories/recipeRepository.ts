import { connectToDatabase } from "@/lib/mongodb";
import { BaseRepository } from "./base/BaseRepository";
import { Recipe } from "@/types/Recipe";
import { MongoRecipeRepository } from "./implementations/MongoRecipeRepository";
import { ensureServicesInitialized, getRepository, RepositoryTokens } from "@/lib/services";

/**
 * Singleton instance of the recipe repository
 */
let recipeRepository: BaseRepository<Recipe> | null = null;

/**
 * Factory function to get or create the recipe repository instance
 * Uses a singleton pattern to avoid creating multiple connections
 * 
 * @returns A promise resolving to the recipe repository instance
 */
export async function getRecipeRepository(): Promise<BaseRepository<Recipe>> {
  // Legacy method to maintain compatibility
  try {
    // Try to get repository from the container first
    await ensureServicesInitialized();
    return getRepository(RepositoryTokens.RecipeRepository);
  } catch (error) {
    // Fall back to the old method
    if (!recipeRepository) {
      const { recipes } = await connectToDatabase();
      recipeRepository = new MongoRecipeRepository(recipes);
    }
    return recipeRepository;
  }
}

/**
 * Get the MongoDB implementation of the recipe repository
 * This is useful when you need access to recipe-specific methods not in the base interface
 * 
 * @returns A promise resolving to the MongoDB recipe repository instance
 */
export async function getMongoRecipeRepository(): Promise<MongoRecipeRepository> {
  const repo = await getRecipeRepository();
  return repo as MongoRecipeRepository;
}