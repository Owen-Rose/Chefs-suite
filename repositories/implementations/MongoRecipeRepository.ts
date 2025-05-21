import { Collection, ObjectId, ClientSession } from "mongodb";
import { Recipe } from "@/types/Recipe";
import { BaseRepository } from "../base/BaseRepository";
import { ListResult, QueryOptions, TransactionContext, DatabaseErrorType } from "../base/types";

/**
 * MongoDB implementation of the Recipe repository
 * Handles all database operations for recipes
 */
export class MongoRecipeRepository implements BaseRepository<Recipe> {
  constructor(private collection: Collection<Recipe>) {}

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
  ): Promise<ListResult<Recipe>> {
    const skip = options?.skip || 0;
    const limit = options?.limit || 10;
    const sort = options?.sort || { createdDate: -1 };
    
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
   * Find all recipes with pagination support
   */
  async findAll(options?: QueryOptions, txContext?: TransactionContext): Promise<ListResult<Recipe>> {
    const filter = options?.filter || {};
    return await this.paginateResults(filter, options, txContext);
  }

  /**
   * Find a recipe by its ID
   */
  async findById(id: string, txContext?: TransactionContext): Promise<Recipe | null> {
    if (!ObjectId.isValid(id)) {
      return null;
    }
    
    const session = this.getSession(txContext);
    return await this.collection.findOne(
      { _id: id },
      { session }
    );
  }

  /**
   * Find recipes matching the provided filter criteria
   */
  async findByFilter(
    filter: Record<string, any>,
    options?: QueryOptions,
    txContext?: TransactionContext
  ): Promise<ListResult<Recipe>> {
    return await this.paginateResults(filter, options, txContext);
  }

  /**
   * Create a new recipe
   */
  async create(data: Omit<Recipe, '_id'>, txContext?: TransactionContext): Promise<Recipe> {
    const session = this.getSession(txContext);
    
    const recipeToInsert = {
      ...data,
      _id: new ObjectId().toString(),
      createdDate: data.createdDate || new Date().toISOString()
    };
    
    const result = await this.collection.insertOne(recipeToInsert as any, { session });
    
    if (!result.acknowledged) {
      throw new Error("Failed to create recipe");
    }
    
    const created = await this.findById(recipeToInsert._id, txContext);
    if (!created) {
      throw new Error("Failed to retrieve created recipe");
    }
    
    return created;
  }

  /**
   * Create multiple recipes in a single operation
   */
  async createMany(data: Omit<Recipe, '_id'>[], txContext?: TransactionContext): Promise<Recipe[]> {
    if (data.length === 0) {
      return [];
    }
    
    const session = this.getSession(txContext);
    
    const recipesToInsert = data.map(recipe => ({
      ...recipe,
      _id: new ObjectId().toString(),
      createdDate: recipe.createdDate || new Date().toISOString()
    }));
    
    const result = await this.collection.insertMany(recipesToInsert as any, { session });
    
    if (!result.acknowledged) {
      throw new Error("Failed to create recipes");
    }
    
    // Get all inserted recipes
    const ids = recipesToInsert.map(recipe => recipe._id);
    const filter = { _id: { $in: ids } };
    const inserted = await this.collection.find(filter, { session }).toArray();
    
    return inserted;
  }

  /**
   * Update an existing recipe by ID
   */
  async update(id: string, data: Partial<Recipe>, txContext?: TransactionContext): Promise<Recipe> {
    if (!ObjectId.isValid(id)) {
      throw new Error("Invalid recipe ID");
    }
    
    const session = this.getSession(txContext);
    
    // Ensure we don't try to update the _id field
    const updateData = { ...data };
    if ('_id' in updateData) {
      delete updateData._id;
    }
    
    const result = await this.collection.findOneAndUpdate(
      { _id: id },
      { $set: updateData },
      { returnDocument: 'after', session }
    );
    
    if (!result) {
      throw new Error("Recipe not found");
    }
    
    return result;
  }

  /**
   * Upsert a recipe (create if it doesn't exist, update if it does)
   */
  async upsert(
    filter: Record<string, any>,
    data: Partial<Recipe>,
    txContext?: TransactionContext
  ): Promise<Recipe> {
    const session = this.getSession(txContext);
    
    // Ensure we don't try to update the _id field
    const updateData = { ...data };
    if ('_id' in updateData) {
      delete updateData._id;
    }
    
    // Prepare update document
    const updateDoc: any = { $set: updateData };
    
    // Only set createdDate on insert if it's not already provided
    if (!('createdDate' in updateData)) {
      updateDoc.$setOnInsert = { createdDate: new Date().toISOString() };
    }
    
    const result = await this.collection.findOneAndUpdate(
      filter,
      updateDoc,
      {
        upsert: true,
        returnDocument: 'after',
        session
      }
    );
    
    if (!result) {
      throw new Error("Failed to upsert recipe");
    }
    
    return result;
  }

  /**
   * Delete a recipe by ID
   */
  async delete(id: string, txContext?: TransactionContext): Promise<void> {
    if (!ObjectId.isValid(id)) {
      throw new Error("Invalid recipe ID");
    }
    
    const session = this.getSession(txContext);
    
    const result = await this.collection.deleteOne(
      { _id: id },
      { session }
    );
    
    if (result.deletedCount === 0) {
      throw new Error("Recipe not found");
    }
  }

  /**
   * Delete recipes matching the provided filter criteria
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
   * Count recipes matching the provided filter criteria
   */
  async count(filter?: Record<string, any>, txContext?: TransactionContext): Promise<number> {
    const session = this.getSession(txContext);
    return await this.collection.countDocuments(filter || {}, { session });
  }

  /**
   * Check if a recipe with the given ID exists
   */
  async exists(id: string, txContext?: TransactionContext): Promise<boolean> {
    if (!ObjectId.isValid(id)) {
      return false;
    }
    
    const session = this.getSession(txContext);
    const count = await this.collection.countDocuments(
      { _id: id },
      { limit: 1, session }
    );
    
    return count > 0;
  }

  /**
   * Recipe-specific method: Find recipes by ingredient name
   */
  async findByIngredient(
    ingredientName: string,
    options?: QueryOptions,
    txContext?: TransactionContext
  ): Promise<ListResult<Recipe>> {
    const filter = {
      "ingredients.productName": {
        $regex: ingredientName,
        $options: "i"
      }
    };
    
    return await this.paginateResults(filter, options, txContext);
  }

  /**
   * Recipe-specific method: Find recipes by station
   */
  async findByStation(
    station: string,
    options?: QueryOptions,
    txContext?: TransactionContext
  ): Promise<ListResult<Recipe>> {
    const filter = {
      station: {
        $regex: station,
        $options: "i"
      }
    };
    
    return await this.paginateResults(filter, options, txContext);
  }
}