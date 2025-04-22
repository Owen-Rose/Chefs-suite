import { RawRecipeData } from '../csvParserService'

export interface ImportAdapter {
    validateFile(file: Buffer): Promise<{ valid: boolean; error?: string }>
    parseFile(file: Buffer): Promise<RawRecipeData[]>
    getFormatName(): string
}