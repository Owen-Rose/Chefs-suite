import { NextApiResponse } from 'next';
import { ExtendedNextApiRequest, withApiAuth } from '../../../lib/auth-middleware';
import { Permission } from '../../../types/Permission';
import type { Multer } from 'multer';
import multer from 'multer';
import { createRouter, NextHandler } from 'next-connect';
import { FileUtils } from '../../../utils/fileUtils';
import { ImportAdapterFactory } from '../../../services/importAdapters/ImportAdapterFactory';
import { RecipeImportService } from '../../../services/recipeImportService';
import { ImportLog, ImportStatus } from '../../../models/ImportLog';
import { ObjectId } from 'mongodb';
import { MonitoringService } from '../../../services/monitoringService';
import { Logger } from '../../../utils/logger';
import { connectToDatabase } from '../../../lib/mongodb';

// Configure multer storage
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Create API route handler
const apiRoute = createRouter<ExtendedNextApiRequest, NextApiResponse>();

// Add error handling middleware
apiRoute.use(async (req: ExtendedNextApiRequest, res: NextApiResponse, next: NextHandler) => {
    try {
        await next();
    } catch (error) {
        Logger.error('API error:', { error });
        res.status(501).json({ error: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
});

// Add multer middleware for file upload
const multerMiddleware = upload.single('file');
apiRoute.use((req: ExtendedNextApiRequest, res: NextApiResponse, next: NextHandler) => {
    multerMiddleware(req as any, res as any, (err: any) => {
        if (err) {
            return res.status(400).json({ error: 'File upload error' });
        }
        next();
    });
});

// GET handler to obtain import status
apiRoute.get(async (req: ExtendedNextApiRequest, res: NextApiResponse) => {
    try {
        const { db } = await connectToDatabase();

        const importLogs = await db.collection('importLogs')
            .find({ userId: new ObjectId(req.user!.id) })
            .sort({ createdAt: -1 })
            .limit(5)
            .toArray();

        return res.status(200).json({ imports: importLogs });
    } catch (error) {
        Logger.error('Error retrieving import logs:', { error });
        return res.status(500).json({ error: 'Failed to retrieve import logs' });
    }
});

// POST handler for recipe import
apiRoute.post(async (req: ExtendedNextApiRequest, res: NextApiResponse) => {
    const startTime = Date.now();

    try {
        const file = (req as any).file;
        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const adapter = ImportAdapterFactory.getAdapter(file.mimetype);
        if (!adapter) {
            return res.status(400).json({
                error: 'Unsupported file type. Supported types: CSV, JSON'
            });
        }

        const fileValidation = await adapter.validateFile(file.buffer);
        if (!fileValidation.valid) {
            return res.status(400).json({ error: fileValidation.error });
        }

        const rawRecipes = await adapter.parseFile(file.buffer);
        const { db } = await connectToDatabase();

        const importResult = await RecipeImportService.importFromCsv(
            file.buffer.toString(),
            req.user!.id,
            db
        );

        const importStatus = importResult.errors.length === 0
            ? ImportStatus.SUCCESS
            : (importResult.imported > 0 ? ImportStatus.PARTIAL : ImportStatus.FAILED);

        const importLog: Omit<ImportLog, '_id'> = {
            userId: new ObjectId(req.user!.id),
            fileName: FileUtils.sanitizeFileName(file.originalname),
            originalFileName: file.originalname,
            status: importStatus,
            totalRecords: importResult.total,
            successfulRecords: importResult.imported,
            failedRecords: importResult.errors.length,
            errors: importResult.errors.length > 0 ? importResult.errors : undefined,
            importedRecipeIds: importResult.importedIds.length > 0 ? importResult.importedIds : undefined,
            createdAt: new Date()
        };

        await db.collection('importLogs').insertOne(importLog);

        const duration = Date.now() - startTime;
        MonitoringService.trackImport({
            userId: req.user!.id,
            duration,
            totalRecords: importResult.total,
            successCount: importResult.imported,
            errorCount: importResult.errors.length,
            fileSize: file.size
        });

        MonitoringService.trackApiPerformance('/api/recipes/import', duration, 200);

        return res.status(200).json({
            success: true,
            total: importResult.total,
            imported: importResult.imported,
            errors: importResult.errors
        });
    } catch (error) {
        Logger.error('Recipe import error:', { error });
        return res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to process import'
        });
    }
});

// Apply authentication middleware to all routes
const handler = withApiAuth(apiRoute.handler(), Permission.IMPORT_RECIPES);

export default handler;

export const config = {
    api: {
        bodyParser: false,
    },
};