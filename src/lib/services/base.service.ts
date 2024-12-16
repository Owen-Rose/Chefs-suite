import { Collection, Document, Filter, ObjectId } from "mongodb";
import { connectToDatabase } from "../db/mongodb";
import { result } from "cypress/types/lodash";

/**
 *  Custom error class for service-level errors
 */

export class ServiceError extends Error {
    constructor(
        message: string,
        public code: string,
        public statusCode: number = 500
    ) {
        super(message);
        this.name = 'ServiceError';
    }
}

/**
 * Base configuration for services
 */

export interface ServiceConfig {
    /**MongoDB collection name */
    collectionName: string;
}

/**
 * Base service providing shared functionality
 */

export abstract class BaseService<T extends Document> {
    protected collection: Collection<T>;
    protected isInitialized: boolean = false;

    constructor(protected config: ServiceConfig) { }

    /**
     * Initializes the service and establishes database connection
     */
    protected async initialize(): Promise<void> {
        if (this.isInitialized) return;

        try {
            const { db } = await connectToDatabase();
            this.collection = db.collection<T>(this.config.collectionName);
            this.isInitialized = true;
        } catch (error) {
            throw new ServiceError(
                'Failed to initialize service',
                'SERVICE_INIT_ERROR',
                500
            );
        }
    }

    /**
     * Ensures service is initialized before operations
     */

    protected async ensureInitialized(): Promise<void> {
        if (!this.isInitialized) {
            await this.initialize();
        }
    }

    /**
     * Convert string ID to ObjectId
     */

    protected toObjectId(id: string): ObjectId {
        try {
            return new ObjectId(id);
        } catch (error) {
            throw new ServiceError('Invalid ID format', 'INVALID_ID', 400);
        }
    }

    /** 
     * Validates an entity before database operations 
    */
    protected abstract validateEntity(entity: Partial<T>): Promise<void>;

    /**
     * Finds one document by ID
     */

    async findById(id: string): Promise<T | null> {
        await this.ensureInitialized();
        try {
            const result = await this.collection.findOne({
                _id: this.toObjectId(id),
            } as Filter<T>);
            return result;
        } catch (error) {
            if (error instanceof ServiceError) throw error;
            throw new ServiceError(
                'Failed to fetch document',
                'FETCH_ERROR',
                500
            );
        }
    }

    /**
     * Finds all documents matching a filter
     */

    async find(filter: Filter<T> = {}): Promise<T[]> {
        await this.ensureInitialized();
        try {
            return await this.collection.find(filter).toArray();
        } catch (error) {
            throw new ServiceError(
                'Failed to fetch documents',
                'FETCH_ERROR',
                500
            );
        }
    }

    /**
     * Creates a new document
     */

    async create(data: Partial<T>): Promise<T> {
        await this.ensureInitialized();
        await this.validateEntity(data);

        try {
            const result = await this.collection.insertOne(data as T);
            const created = await this.findById(result.insertedId.toString());
            if (!created) {
                throw new ServiceError(
                    'Failed to fetch created document',
                    'CREATE_ERROR',
                    500
                );
            }
            return created;
        } catch (error) {
            if (error instanceof ServiceError) throw error;
            throw new ServiceError(
                'Failed to create document',
                'CREATE_ERROR',
                500
            );
        }
    }

    /**
     * Updates an existing document
     */

    async update(id: string, data: Partial<T>): Promise<T | null> {
        await this.ensureInitialized();
        await this.validateEntity(data);

        try {
            const result = await this.collection.findOneAndUpdate(
                { _id: this.toObjectId(id) } as Filter<T>,
                { $set: data },
                { returnDocument: 'after' }
            );
            return result.value;
        } catch (error) {
            throw new ServiceError(
                'Failed to update document',
                'UPDATE_ERROR',
                500
            );
        }
    }

    /**
     * Deletes a document by ID
     */

    async delete(id: string): Promise<boolean> {
        await this.ensureInitialized();
        try {
            const result = await this.collection.deleteOne({
                _id: this.toObjectId(id),
            } as Filter<T>);
            return result.deletedCount === 1;
        } catch (error) {
            throw new ServiceError(
                'Failed to delete docment',
                'DELETE_ERROR',
                500
            );
        }
    }
}