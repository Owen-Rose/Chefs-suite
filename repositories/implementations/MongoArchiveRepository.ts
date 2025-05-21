import { Collection, ObjectId, ClientSession } from "mongodb";
import { Archive } from "@/types/Archive";
import { Recipe } from "@/types/Recipe";
import { BaseRepository } from "../base/BaseRepository";
import { ListResult, QueryOptions, TransactionContext } from "../base/types";

/**
 * MongoDB implementation of the Archive repository
 * Handles all database operations for archives
 */
export class MongoArchiveRepository implements BaseRepository<Archive> {
  constructor(private collection: Collection<Archive>) {}

  /**
   * Helper method to get MongoDB session from transaction context
   */
  private getSession(txContext?: TransactionContext): ClientSession | undefined {
    return txContext?.session as ClientSession | undefined;
  }

  /**
   * Helper method to handle pagination for list results
   */
  private async paginateResults(
    filter: Record<string, any>,
    options?: QueryOptions,
    txContext?: TransactionContext
  ): Promise<ListResult<Archive>> {
    const skip = options?.skip || 0;
    const limit = options?.limit || 10;
    const sort = options?.sort || { lastModifiedDate: -1 };
    
    const session = this.getSession(txContext);
    
    const cursor = this.collection.find(filter, { session });
    const total = await this.collection.countDocuments(filter, { session });
    
    if (sort) {
      cursor.sort(sort);
    }
    
    const items = await cursor.skip(skip).limit(limit).toArray();
    const page = Math.floor(skip / limit) + 1;
    const totalPages = Math.ceil(total / limit);
    
    return {
      items,
      total,
      page,
      pageSize: limit,
      totalPages
    };
  }

  /**
   * Helper method to ensure ObjectId conversion for archive data
   */
  private ensureObjectIds(data: Partial<Archive>): Partial<Archive> {
    const processed = { ...data };
    
    // Convert createdBy to ObjectId if it's a string
    if (typeof processed.createdBy === 'string' && ObjectId.isValid(processed.createdBy)) {
      processed.createdBy = new ObjectId(processed.createdBy);
    }
    
    // Process recipes array if it exists
    if (processed.recipes && Array.isArray(processed.recipes)) {
      processed.recipes = processed.recipes.map(recipe => ({
        ...recipe,
        originalId: typeof recipe.originalId === 'string' && ObjectId.isValid(recipe.originalId)
          ? new ObjectId(recipe.originalId)
          : recipe.originalId
      }));
    }
    
    return processed;
  }

  /**
   * Find all archives with pagination support
   */
  async findAll(options?: QueryOptions, txContext?: TransactionContext): Promise<ListResult<Archive>> {
    const filter = options?.filter || {};
    return await this.paginateResults(filter, options, txContext);
  }

  /**
   * Find an archive by its ID
   */
  async findById(id: string, txContext?: TransactionContext): Promise<Archive | null> {
    if (!ObjectId.isValid(id)) {
      return null;
    }
    
    const session = this.getSession(txContext);
    return await this.collection.findOne(
      { _id: new ObjectId(id) },
      { session }
    );
  }

  /**
   * Find archives matching the provided filter criteria
   */
  async findByFilter(
    filter: Record<string, any>,
    options?: QueryOptions,
    txContext?: TransactionContext
  ): Promise<ListResult<Archive>> {
    return await this.paginateResults(filter, options, txContext);
  }

  /**
   * Create a new archive
   */
  async create(data: Omit<Archive, '_id'>, txContext?: TransactionContext): Promise<Archive> {
    const session = this.getSession(txContext);
    
    const now = new Date();
    const archiveToInsert = {
      ...data,
      createdDate: data.createdDate || now,
      lastModifiedDate: data.lastModifiedDate || now,
      recipes: data.recipes || []
    };
    
    // Ensure ObjectId conversions
    const processedArchive = this.ensureObjectIds(archiveToInsert);
    
    const result = await this.collection.insertOne(processedArchive as any, { session });
    
    if (!result.acknowledged) {
      throw new Error("Failed to create archive");
    }
    
    const created = await this.collection.findOne(
      { _id: result.insertedId },
      { session }
    );
    
    if (!created) {
      throw new Error("Failed to retrieve created archive");
    }
    
    return created;
  }

  /**
   * Create multiple archives in a single operation
   */
  async createMany(data: Omit<Archive, '_id'>[], txContext?: TransactionContext): Promise<Archive[]> {
    if (data.length === 0) {
      return [];
    }
    
    const session = this.getSession(txContext);
    const now = new Date();
    
    const archivesToInsert = data.map(archive => {
      const preparedArchive = {
        ...archive,
        createdDate: archive.createdDate || now,
        lastModifiedDate: archive.lastModifiedDate || now,
        recipes: archive.recipes || []
      };
      
      // Ensure ObjectId conversions
      return this.ensureObjectIds(preparedArchive);
    });
    
    const result = await this.collection.insertMany(archivesToInsert as any, { session });
    
    if (!result.acknowledged) {
      throw new Error("Failed to create archives");
    }
    
    // Get all inserted archives
    const insertedIds = Object.values(result.insertedIds);
    const filter = { _id: { $in: insertedIds } };
    const inserted = await this.collection.find(filter, { session }).toArray();
    
    return inserted;
  }

  /**
   * Update an existing archive by ID
   */
  async update(id: string, data: Partial<Archive>, txContext?: TransactionContext): Promise<Archive> {
    if (!ObjectId.isValid(id)) {
      throw new Error("Invalid archive ID");
    }
    
    const session = this.getSession(txContext);
    
    // Always update the lastModifiedDate timestamp
    const updateData = {
      ...data,
      lastModifiedDate: new Date()
    };
    
    // Ensure ObjectId conversions
    const processedData = this.ensureObjectIds(updateData);
    
    const result = await this.collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: processedData },
      { returnDocument: 'after', session }
    );
    
    if (!result) {
      throw new Error("Archive not found");
    }
    
    return result;
  }

  /**
   * Upsert an archive (create if it doesn't exist, update if it does)
   */
  async upsert(
    filter: Record<string, any>,
    data: Partial<Archive>,
    txContext?: TransactionContext
  ): Promise<Archive> {
    const session = this.getSession(txContext);
    const now = new Date();
    
    // Prepare data for update/insert
    const updateData = {
      ...data,
      lastModifiedDate: now
    };
    
    // Ensure ObjectId conversions
    const processedData = this.ensureObjectIds(updateData);
    
    const result = await this.collection.findOneAndUpdate(
      filter,
      {
        $set: processedData,
        $setOnInsert: {
          createdDate: now,
          recipes: []
        }
      },
      {
        upsert: true,
        returnDocument: 'after',
        session
      }
    );
    
    if (!result) {
      throw new Error("Failed to upsert archive");
    }
    
    return result;
  }

  /**
   * Delete an archive by ID
   */
  async delete(id: string, txContext?: TransactionContext): Promise<void> {
    if (!ObjectId.isValid(id)) {
      throw new Error("Invalid archive ID");
    }
    
    const session = this.getSession(txContext);
    
    const result = await this.collection.deleteOne(
      { _id: new ObjectId(id) },
      { session }
    );
    
    if (result.deletedCount === 0) {
      throw new Error("Archive not found");
    }
  }

  /**
   * Delete archives matching the provided filter criteria
   */
  async deleteMany(
    filter: Record<string, any>,
    txContext?: TransactionContext
  ): Promise<number> {
    const session = this.getSession(txContext);
    
    const result = await this.collection.deleteMany(filter, { session });
    return result.deletedCount;
  }

  /**
   * Count archives matching the provided filter criteria
   */
  async count(filter?: Record<string, any>, txContext?: TransactionContext): Promise<number> {
    const session = this.getSession(txContext);
    return await this.collection.countDocuments(filter || {}, { session });
  }

  /**
   * Check if an archive with the given ID exists
   */
  async exists(id: string, txContext?: TransactionContext): Promise<boolean> {
    if (!ObjectId.isValid(id)) {
      return false;
    }
    
    const session = this.getSession(txContext);
    const count = await this.collection.countDocuments(
      { _id: new ObjectId(id) },
      { limit: 1, session }
    );
    
    return count > 0;
  }

  /**
   * Find archives created by a specific user
   * 
   * @param userId - The ID of the user who created the archives
   * @param options - Query options for pagination and sorting
   * @param txContext - Optional transaction context
   * @returns A paginated list of archives created by the user
   */
  async findByCreator(
    userId: string,
    options?: QueryOptions,
    txContext?: TransactionContext
  ): Promise<ListResult<Archive>> {
    if (!ObjectId.isValid(userId)) {
      return {
        items: [],
        total: 0,
        page: 1,
        pageSize: options?.limit || 10,
        totalPages: 0
      };
    }
    
    const createdBy = new ObjectId(userId);
    return this.findByFilter({ createdBy }, options, txContext);
  }

  /**
   * Add a recipe to an archive
   * 
   * @param archiveId - The ID of the archive
   * @param recipe - The recipe to add with archivedDate and originalId
   * @param txContext - Optional transaction context
   * @returns The updated archive
   * @throws Error if the archive is not found
   */
  async addRecipe(
    archiveId: string,
    recipe: Omit<Recipe, '_id'> & { archivedDate: Date; originalId: string | ObjectId },
    txContext?: TransactionContext
  ): Promise<Archive> {
    if (!ObjectId.isValid(archiveId)) {
      throw new Error("Invalid archive ID");
    }
    
    const session = this.getSession(txContext);
    
    // Ensure originalId is an ObjectId
    const recipeToAdd = {
      ...recipe,
      originalId: typeof recipe.originalId === 'string' 
        ? new ObjectId(recipe.originalId) 
        : recipe.originalId
    };
    
    const result = await this.collection.findOneAndUpdate(
      { _id: new ObjectId(archiveId) },
      { 
        $push: { recipes: recipeToAdd },
        $set: { lastModifiedDate: new Date() }
      },
      { returnDocument: 'after', session }
    );
    
    if (!result) {
      throw new Error("Archive not found");
    }
    
    return result;
  }

  /**
   * Remove a recipe from an archive
   * 
   * @param archiveId - The ID of the archive
   * @param recipeId - The original ID of the recipe to remove
   * @param txContext - Optional transaction context
   * @returns The updated archive
   * @throws Error if the archive is not found
   */
  async removeRecipe(
    archiveId: string,
    recipeId: string,
    txContext?: TransactionContext
  ): Promise<Archive> {
    if (!ObjectId.isValid(archiveId) || !ObjectId.isValid(recipeId)) {
      throw new Error("Invalid ID provided");
    }
    
    const session = this.getSession(txContext);
    const originalId = new ObjectId(recipeId);
    
    const result = await this.collection.findOneAndUpdate(
      { _id: new ObjectId(archiveId) },
      { 
        $pull: { recipes: { originalId } },
        $set: { lastModifiedDate: new Date() }
      },
      { returnDocument: 'after', session }
    );
    
    if (!result) {
      throw new Error("Archive not found");
    }
    
    return result;
  }
}