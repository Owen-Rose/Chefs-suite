import { ImportAdapter } from './ImportAdapter'
import { CsvImportAdapter } from './CsvImportAdapter'
import { JsonImportAdapter } from './JsonImportAdapter'

export class ImportAdapterFactory {
    static getAdapter(fileType: string): ImportAdapter | null {
        switch (fileType.toLowerCase()) {
            case 'text/csv':
            case 'csv':
                return new CsvImportAdapter()

            case 'application/json':
            case 'json':
                return new JsonImportAdapter()

            default:
                return null
        }
    }
}