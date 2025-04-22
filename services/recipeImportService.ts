import { Recipe } from '../types/Recipe';
import { ObjectId } from 'mongodb';
import { CsvParserService, RawRecipeData } from './csvParserService';
import { RecipeNormalizerService } from './recipeNormalizerService';
import { Logger } from '../utils/logger';
import fs from 'fs';
import readline from 'readline';

export class RecipeImportService {
    static async importFromCsv(
        csvContent: string,
        userId: string,
        db: any
    ): Promise<{
        total: number;
        imported: number;
        errors: { row: number; error: string }[];
        importedIds: ObjectId[];
    }> {
        const rawRecipes = CsvParserService.parseRecipesCsv(csvContent);
        const { validRecipes, errors } = RecipeNormalizerService.normalizeRecipes(rawRecipes);
        const importedIds: ObjectId[] = [];

        for (const recipe of validRecipes) {
            try {
                // Update to match your Recipe type
                const newRecipe: Partial<Recipe> = {
                    ...recipe,
                    createdDate: new Date().toISOString(),
                    importSource: 'csv',
                    importedAt: new Date()
                };

                const result = await db.collection('recipes').insertOne(newRecipe);
                importedIds.push(result.insertedId);
            } catch (error) {
                Logger.error('Error saving recipe:', { error });
                errors.push({
                    row: -1,
                    error: `Database error: ${error instanceof Error ? error.message : 'Unknown error'}`
                });
            }
        }

        return {
            total: rawRecipes.length,
            imported: importedIds.length,
            errors,
            importedIds
        };
    }

    static async importLargeCsvFile(
        filePath: string,
        userId: string,
        db: any,
        chunkSize = 100
    ): Promise<{
        total: number;
        imported: number;
        errors: { row: number; error: string }[];
        importedIds: ObjectId[];
    }> {
        const importResults = {
            total: 0,
            imported: 0,
            errors: [] as { row: number; error: string }[],
            importedIds: [] as ObjectId[]
        };

        const fileStream = fs.createReadStream(filePath);
        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        });

        let headers: string[] = [];
        let currentChunk: RawRecipeData[] = [];
        let lineCount = 0;

        for await (const line of rl) {
            lineCount++;

            if (lineCount === 1) {
                headers = line.split(',').map(h => h.trim());
                continue;
            }

            try {
                const rowData = this.parseCSVLine(line, headers);
                currentChunk.push(rowData);
            } catch (error) {
                importResults.errors.push({
                    row: lineCount,
                    error: `Failed to parse line: ${error instanceof Error ? error.message : 'Unknown error'}`
                });
            }

            if (currentChunk.length >= chunkSize) {
                const { validRecipes, errors } = RecipeNormalizerService.normalizeRecipes(currentChunk);

                const offsetErrors = errors.map(err => ({
                    ...err,
                    row: err.row + (lineCount - currentChunk.length)
                }));

                importResults.errors.push(...offsetErrors);

                for (const recipe of validRecipes) {
                    try {
                        const newRecipe: Partial<Recipe> = {
                            ...recipe,
                            createdDate: new Date().toISOString(),
                            importSource: 'csv',
                            importedAt: new Date()
                        };

                        const result = await db.collection('recipes').insertOne(newRecipe);
                        importResults.importedIds.push(result.insertedId);
                        importResults.imported++;
                    } catch (error) {
                        Logger.error('Error saving recipe:', { error });
                        importResults.errors.push({
                            row: -1,
                            error: `Database error: ${error instanceof Error ? error.message : 'Unknown error'}`
                        });
                    }
                }

                currentChunk = [];
            }
        }

        if (currentChunk.length > 0) {
            const { validRecipes, errors } = RecipeNormalizerService.normalizeRecipes(currentChunk);

            const offsetErrors = errors.map(err => ({
                ...err,
                row: err.row + (lineCount - currentChunk.length)
            }));

            importResults.errors.push(...offsetErrors);

            for (const recipe of validRecipes) {
                try {
                    const newRecipe: Partial<Recipe> = {
                        ...recipe,
                        createdDate: new Date().toISOString(),
                        importSource: 'csv',
                        importedAt: new Date()
                    };

                    const result = await db.collection('recipes').insertOne(newRecipe);
                    importResults.importedIds.push(result.insertedId);
                    importResults.imported++;
                } catch (error) {
                    Logger.error('Error saving recipe:', { error });
                    importResults.errors.push({
                        row: -1,
                        error: `Database error: ${error instanceof Error ? error.message : 'Unknown error'}`
                    });
                }
            }
        }

        importResults.total = lineCount - 1;

        return importResults;
    }

    private static parseCSVLine(line: string, headers: string[]): RawRecipeData {
        const values = line.split(',');
        const result: any = {};

        headers.forEach((header, index) => {
            result[header] = values[index] ? values[index].trim() : '';
        });

        return result as RawRecipeData;
    }
}

export default RecipeImportService;
