import { parse } from 'csv-parse/sync'

export interface RawRecipeData {
    name: string
    description?: string
    prepTime?: number | string
    cookTime?: number | string
    servings?: number | string
    ingredients: string; // Raw text to be parsed
    instructions: string; // Raw text to be parsed
    [key: string]: any; // Allow any other fields
}

export class CsvParserService {
    /**
     * Parses CSV file content into structured data
     */
    static parseRecipesCsv(csvContent: string): RawRecipeData[] {
        try {
            // Parse CSV to records with headers
            const records = parse(csvContent, {
                columns: true,
                skip_empty_lines: true,
                trim: true
            })

            return records
        } catch (error) {
            console.error('CSV parsing error:', error)
            throw new Error('Failed to parse CSV file. Please check the format.')
        }
    }

    /**
     * Validates required columns in CSV header
     */
    static validateCsvHeaders(headers: string[]): { valid: boolean; error?: string } {
        const requiredHeaders = ['name', 'ingredients', 'instructions']

        const missingHeaders = requiredHeaders.filter(header => !headers.includes(header))

        if (missingHeaders.length > 0) {
            return {
                valid: false,
                error: `Missing required columns: ${missingHeaders.join(', ')}`
            }
        }

        return { valid: true }
    }
}