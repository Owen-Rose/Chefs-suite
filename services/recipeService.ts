// import { Recipe } from "@/types/Recipe";
// //import { RecipeRepository } from "../repositories/recipeRepository";
// import { ValidationError } from "../errors/ValidationError";
// import { NotFoundError } from "../errors/NotFoundError";

// export class RecipeService {
//     constructor(private repository: RecipeRepository) { }

//     async getAllRecipes(): Promise<Recipe[]> {
//         return await this.repository.findAll();
//     }

//     async getRecipeById(id: string): Promise<Recipe> {
//         const recipe = await this.repository.findById(id);
//         if (!recipe) {
//             throw new NotFoundError("Recipe not found");
//         }
//         return recipe;
//     }

//     async createRecipe(recipe: Omit<Recipe, "_id">): Promise<Recipe> {
//         this.validateRecipe(recipe);
//         return await this.repository.create(recipe);
//     }

//     async updateRecipe(id: string, recipe: Partial<Recipe>): Promise<Recipe> {
//         if (recipe.name !== undefined) {
//             this.validateRecipeName(recipe.name);
//         }
//         return await this.repository.update(id, recipe);
//     }

//     async deleteRecipe(id: string): Promise<void> {
//         await this.repository.delete(id);
//     }

//     private validateRecipe(recipe: Omit<Recipe, "_id">): void {
//         this.validateRecipeName(recipe.name);

//         if (!recipe.ingredients || recipe.ingredients.length === 0) {
//             throw new ValidationError("Recipe must have at least one ingredient");
//         }

//         if (!recipe.procedure || recipe.procedure.length === 0) {
//             throw new ValidationError("Recipe must have at least one procedure step");
//         }
//     }

//     private validateRecipeName(name: string): void {
//         if (!name || name.trim().length === 0) {
//             throw new ValidationError("Recipe name is required");
//         }
//         if (name.length > 100) {
//             throw new ValidationError("Recipe name must be less than 100 characters");
//         }
//     }
// }