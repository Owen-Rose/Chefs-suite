import { RawRecipeData } from './csvParserService'
import { Recipe } from '../types/Recipe'

export class RecipeNormalizerService {
    /**
     * Transforms raw CSV data into Recipe objects
     */
    static normalizeRecipes(rawRecipes: RawRecipeData[]): {
        validRecipes: Partial<Recipe>[]
        errors: { row: number; error: string }[]
    } {
        const validRecipes: Partial<Recipe>[] = []
        const errors: { row: number; error: string }[] = []

        rawRecipes.forEach((rawRecipe, index) => {
            try {
                // Validate required fields
                if (!rawRecipe.name || !rawRecipe.ingredients || !rawRecipe.instructions) {
                    throw new Error('Missing required fields')
                }

                // Parse ingredients from string to structured data
                const ingredients = this.parseIngredients(rawRecipe.ingredients)

                // Parse instructions from string to structured data
                const instructions = this.parseInstructions(rawRecipe.instructions)

                // Create normalized recipe object
                const recipe: Partial<Recipe> = {
                    name: rawRecipe.name.trim(),
                    description: rawRecipe.description?.trim(),
                    ingredients,
                    procedure: instructions,
                    version: '1.0',
                    station: rawRecipe.station?.trim() || 'default',
                    batchNumber: parseInt(rawRecipe.batchNumber as string, 10) || 1,
                    equipment: rawRecipe.equipment ? rawRecipe.equipment.split(',').map(e => e.trim()) : [],
                    yield: rawRecipe.servings?.toString() || '1',
                    portionSize: rawRecipe.portionSize?.toString() || '1',
                    portionsPerRecipe: rawRecipe.portionsPerRecipe?.toString() || '1',
                    createdDate: rawRecipe.createdDate ? rawRecipe.createdDate.toString() : new Date().toISOString(),
                    // Add default values for other required fields
                }

                validRecipes.push(recipe)
            } catch (error) {
                errors.push({
                    row: index + 2, // +2 because of 0-indexing and header row
                    error: error instanceof Error ? error.message : 'Unknown error'
                })
            }
        })

        return { validRecipes, errors }
    }

    /**
     * Parse ingredients string into structured data
     * Assumes format like "1 cup flour, 2 tbsp sugar"
     */
    private static parseIngredients(ingredientsText: string): any[] {
        // Split by newlines or commas
        return ingredientsText.split(/[\r\n]+|,/)
            .map(item => item.trim())
            .filter(item => item)
            .map(item => {
                // Simple parsing example, adjust based on your needs
                const match = item.match(/^([\d.\/]+)?\s*(\w+)?\s+(.+)$/)
                if (match) {
                    return {
                        quantity: match[1] || '',
                        unit: match[2] || '',
                        name: match[3] || item
                    }
                }
                return { name: item, quantity: '', unit: '' }
            })
    }

    /**
     * Parse instructions string into structured steps
     */
    private static parseInstructions(instructionsText: string): string[] {
        // Split by line breaks or numbered items
        return instructionsText.split(/[\r\n]+|(?:\d+\.\s*)/)
            .map(item => item.trim())
            .filter(item => item)
    }
}