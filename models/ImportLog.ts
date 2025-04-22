import { ObjectId } from 'mongodb';

export enum ImportStatus {
    SUCCESS = 'success',
    PARTIAL = 'partial',
    FAILED = 'failed'
}

export interface ImportLog {
    _id?: string | ObjectId;
    userId: string | ObjectId;
    fileName: string;
    originalFileName: string;
    status: ImportStatus;
    totalRecords: number;
    successfulRecords: number;
    failedRecords: number;
    errors?: { row: number; error: string }[];
    importedRecipeIds?: (string | ObjectId)[];
    createdAt: Date;
}
