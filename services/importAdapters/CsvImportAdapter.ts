import { ImportAdapter } from './ImportAdapter'
import { CsvParserService, RawRecipeData } from '../csvParserService'

export class CsvImportAdapter implements ImportAdapter {
    async validateFile(file: Buffer): Promise<{ valid: boolean; error?: string }> {
        try {
            const content = file.toString('utf8')
            const firstLine = content.split('\n')[0]
            const headers = firstLine.split(',').map(h => h.trim())

            return CsvParserService.validateCsvHeaders(headers)
        } catch (error) {
            return {
                valid: false,
                error: 'Invalid CSV format'
            }
        }
    }

    async parseFile(file: Buffer): Promise<RawRecipeData[]> {
        const content = file.toString('utf8')
        return CsvParserService.parseRecipesCsv(content)
    }

    getFormatName(): string {
        return 'CSV'
    }
}