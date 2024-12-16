import { Recipe } from "@/types";
import { BaseService, ServiceError } from "./base.service";
import { ObjectId } from "mongodb";

/**
 * Recipe-specific error messages
 */

const RECIPE_ERRORS = {
    INVALID_NAME: 'Recipe name is required and must be between 3 and 100 characters',
    INVALID_STATION: 'Valid station is required',
    INVALID_BATCH: 'Batch number must be greater than 0',
    INVALID_INGREDIENTS: 'At least one valid ingredient is required',
    INVALID_PROCEDURE: 'At least one procedure step is required',
} as const;

/**
 * Allowed stations for recipes
 */

const VALID_STATIONS = ['Garde Manger', 'Entremetier', 'Pastry', 'Functions', 'Grill'] as const;

export class RecipeService extends BaseService<Recipe> {
    constructor() {
        super({ collectionName: 'recipes' });
    }

    /**
     * VAlidates recipe data before database operations
     */

    protected async validateEntity(data: Partial<Recipe>): Promise<void> {
        const errors: string[] = [];

        //Validate name
        if (!data.name || data.name.length < 3 || data.name.length > 100) {
            errors.push(RECIPE_ERRORS.INVALID_NAME);
        }

        //Validate station
        if (!data.station || !VALID_STATIONS.includes(data.station as any)) {
            errors.push(RECIPE_ERRORS.INVALID_STATION);
        }

        //Validate batch number
        if (!data.batchNumber || data.batchNumber <= 0) {
            errors.push(RECIPE_ERRORS.INVALID_BATCH);
        }

        // Validate ingredients
        if (!data.ingredients?.length || !data.ingredients.every(this.validateIngredient)) {
            errors.push(RECIPE_ERRORS.INVALID_INGREDIENTS);
        }

        // Validate procedure
        if (!data.procedure?.length || !data.procedure.every(step => step.trim().length > 0)) {
            errors.push(RECIPE_ERRORS.INVALID_PROCEDURE);
        }

        if (errors.length > 0) {
            throw new ServiceError(
                `Validation failed: ${errors.join(', ')}`,
                'VALIDATION_ERROR',
                400
            );
        }
    }

    /**
     * Validates a single ingredient
     */

    private validateIngredient(ingredient: Recipe['ingredients'][0]): boolean {
        return (
            !!ingredient.productName &&
            ingredient.productName.trim().length > 0 &&
            typeof ingredient.quantity === 'number' &&
            ingredient.quantity > 0 &&
            !!ingredient.unit &&
            ingredient.unit.trim().length > 0
        );
    }

    /**
     * Finds active (non-archived) recipes
     */

    async findActiveRecipes(): Promise<Recipe[]> {
        return this.find({ archiveId: null });

    }

    /**
     * Archives a recipe
     */
    async archiveRecipe(recipeId: string, archiveId: string): Promise<Recipe | null> {
        return this.update(recipeId, {
            archiveId: new ObjectId(archiveId),
            archiveDate: new Date(),
        });
    }

    /**
     * Unarchive a recipe
     */

    async unarchiveRecipe(recipeId: string): Promise<Recipe | null> {
        return this.update(recipeId, {
            archiveId: null,
            archiveDate: null,
        });
    }

    /**
     * Batch archives multiple recipes
     */

    async batchArchive(recipeIds: string[], archiveId: string): Promise<void> {
        await this.ensureInitialized();
        try {
            await this.collection.updateMany(
                { _id: { $in: recipeIds.map(id => this.toObjectId(id)) } },
                {
                    $set: {
                        archiveId: new ObjectId(archiveId),
                        archiveDate: new Date(),
                    },
                }
            );
        } catch (error) {
            throw new ServiceError(
                'Failed to batch archive recipes',
                'ARCHIVE_ERROR',
                500
            );
        }
    }

    /**
     * Duplicates a recipe with a new name
     */

    async duplicateRecipe(recipeId: string, newName: string): Promise<Recipe> {
        const recipe = await this.findById(recipeId);
        if (!recipe) {
            throw new ServiceError('Recipe not found', 'NOT_FOUND', 404)
        }

        const { _id, ...recipeData } = recipe;
        return this.create({
            ...recipeData,
            name: newName,
            createdDate: new Date().toISOString(),
            version: '1.0',
        });
    }
}

export const recipeService = new RecipeService();
