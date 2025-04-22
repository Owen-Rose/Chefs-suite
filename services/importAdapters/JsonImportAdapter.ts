import { ImportAdapter } from './ImportAdapter'
import { RawRecipeData } from '../csvParserService'

export class JsonImportAdapter implements ImportAdapter {
    async validateFile(file: Buffer): Promise<{ valid: boolean; error?: string }> {
        try {
            const content = file.toString('utf8')
            const data = JSON.parse(content)

            if (!Array.isArray(data)) {
                return {
                    valid: false,
                    error: 'JSON must contain an array of recipes'
                }
            }

            // Check for required fields in first recipe
            if (data.length > 0) {
                const firstRecipe = data[0]
                const requiredFields = ['name', 'ingredients', 'instructions']
                const missingFields = requiredFields.filter(field => !firstRecipe.hasOwnProperty(field))

                if (missingFields.length > 0) {
                    return {
                        valid: false,
                        error: `Missing required fields: ${missingFields.join(', ')}`
                    }
                }
            }

            return { valid: true }
        } catch (error) {
            return {
                valid: false,
                error: 'Invalid JSON format'
            }
        }
    }

    async parseFile(file: Buffer): Promise<RawRecipeData[]> {
        const content = file.toString('utf8')
        const recipes = JSON.parse(content)

        return recipes.map((recipe: any) => ({
            name: recipe.name,
            description: recipe.description || '',
            prepTime: recipe.prepTime,
            cookTime: recipe.cookTime,
            servings: recipe.servings,
            ingredients: Array.isArray(recipe.ingredients)
                ? recipe.ingredients.join('\n')
                : recipe.ingredients,
            instructions: Array.isArray(recipe.instructions)
                ? recipe.instructions.join('\n')
                : recipe.instructions
        }))
    }

    getFormatName(): string {
        return 'JSON'
    }
}