import { ObjectId } from 'mongodb';

export class FileUtils {
    private static MAX_FILE_SIZE_MB = 5; // 5MB limit
    private static ALLOWED_EXTENSIONS = ['.csv', '.json']

    /**
     * Validates file type and size
     */
    static validateFile(file: File): { valid: boolean; error?: string } {
        // Check file extension
        const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
        if (!this.ALLOWED_EXTENSIONS.includes(extension)) {
            return {
                valid: false,
                error: `Invalid file type. Allowed types: ${this.ALLOWED_EXTENSIONS.join(', ')}`
            }
        }

        // Check file size
        const fileSizeMB = file.size / (1024 * 1024)
        if (fileSizeMB > this.MAX_FILE_SIZE_MB) {
            return {
                valid: false,
                error: `File size exceeds ${this.MAX_FILE_SIZE_MB}MB limit`
            }
        }

        return { valid: true }
    }

    /**
     * Sanitizes file name to prevent path traversal attacks
     */
    static sanitizeFileName(fileName: string): string {
        return fileName.replace(/[^\w\s.-]/gi, '')
    }
}

export function toObjectId(id: string | undefined | null): ObjectId | undefined {
    if (!id || typeof id !== 'string') return undefined;
    try {
        return new ObjectId(id);
    } catch {
        return undefined;
    }
}