import { Collection, ObjectId, ClientSession } from "mongodb";
import { User } from "@/types/User";
import { BaseRepository } from "../base/BaseRepository";
import { ListResult, QueryOptions, TransactionContext } from "../base/types";

/**
 * MongoDB implementation of the User repository
 * Handles all database operations for users
 */
export class MongoUserRepository implements BaseRepository<User> {
  constructor(private collection: Collection<User>) {}

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
  ): Promise<ListResult<User>> {
    const skip = options?.skip || 0;
    const limit = options?.limit || 10;
    const sort = options?.sort || { createdAt: -1 };
    
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
   * Find all users with pagination support
   */
  async findAll(options?: QueryOptions, txContext?: TransactionContext): Promise<ListResult<User>> {
    const filter = options?.filter || {};
    return await this.paginateResults(filter, options, txContext);
  }

  /**
   * Find a user by their ID
   */
  async findById(id: string, txContext?: TransactionContext): Promise<User | null> {
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
   * Find users matching the provided filter criteria
   */
  async findByFilter(
    filter: Record<string, any>,
    options?: QueryOptions,
    txContext?: TransactionContext
  ): Promise<ListResult<User>> {
    return await this.paginateResults(filter, options, txContext);
  }

  /**
   * Create a new user
   */
  async create(data: Omit<User, '_id'>, txContext?: TransactionContext): Promise<User> {
    const session = this.getSession(txContext);
    
    const now = new Date();
    const userToInsert = {
      ...data,
      email: data.email.toLowerCase(),
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now
    };
    
    const result = await this.collection.insertOne(userToInsert as any, { session });
    
    if (!result.acknowledged) {
      throw new Error("Failed to create user");
    }
    
    const created = await this.collection.findOne(
      { _id: result.insertedId },
      { session }
    );
    
    if (!created) {
      throw new Error("Failed to retrieve created user");
    }
    
    return created;
  }

  /**
   * Create multiple users in a single operation
   */
  async createMany(data: Omit<User, '_id'>[], txContext?: TransactionContext): Promise<User[]> {
    if (data.length === 0) {
      return [];
    }
    
    const session = this.getSession(txContext);
    const now = new Date();
    
    const usersToInsert = data.map(user => ({
      ...user,
      email: user.email.toLowerCase(),
      createdAt: user.createdAt || now,
      updatedAt: user.updatedAt || now
    }));
    
    const result = await this.collection.insertMany(usersToInsert as any, { session });
    
    if (!result.acknowledged) {
      throw new Error("Failed to create users");
    }
    
    // Get all inserted users
    const insertedIds = Object.values(result.insertedIds);
    const filter = { _id: { $in: insertedIds } };
    const inserted = await this.collection.find(filter, { session }).toArray();
    
    return inserted;
  }

  /**
   * Update an existing user by ID
   */
  async update(id: string, data: Partial<User>, txContext?: TransactionContext): Promise<User> {
    if (!ObjectId.isValid(id)) {
      throw new Error("Invalid user ID");
    }
    
    const session = this.getSession(txContext);
    
    // Always update the updatedAt timestamp
    const updateData = {
      ...data,
      updatedAt: new Date()
    };
    
    // If email is being updated, ensure it's lowercase
    if (data.email) {
      updateData.email = data.email.toLowerCase();
    }
    
    const result = await this.collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: 'after', session }
    );
    
    if (!result) {
      throw new Error("User not found");
    }
    
    return result;
  }

  /**
   * Upsert a user (create if it doesn't exist, update if it does)
   */
  async upsert(
    filter: Record<string, any>,
    data: Partial<User>,
    txContext?: TransactionContext
  ): Promise<User> {
    const session = this.getSession(txContext);
    const now = new Date();
    
    // Prepare data for update/insert
    const updateData = { ...data, updatedAt: now };
    if (data.email) {
      updateData.email = data.email.toLowerCase();
    }
    
    const result = await this.collection.findOneAndUpdate(
      filter,
      {
        $set: updateData,
        $setOnInsert: {
          createdAt: now
        }
      },
      {
        upsert: true,
        returnDocument: 'after',
        session
      }
    );
    
    if (!result) {
      throw new Error("Failed to upsert user");
    }
    
    return result;
  }

  /**
   * Delete a user by ID
   */
  async delete(id: string, txContext?: TransactionContext): Promise<void> {
    if (!ObjectId.isValid(id)) {
      throw new Error("Invalid user ID");
    }
    
    const session = this.getSession(txContext);
    
    const result = await this.collection.deleteOne(
      { _id: new ObjectId(id) },
      { session }
    );
    
    if (result.deletedCount === 0) {
      throw new Error("User not found");
    }
  }

  /**
   * Delete users matching the provided filter criteria
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
   * Count users matching the provided filter criteria
   */
  async count(filter?: Record<string, any>, txContext?: TransactionContext): Promise<number> {
    const session = this.getSession(txContext);
    return await this.collection.countDocuments(filter || {}, { session });
  }

  /**
   * Check if a user with the given ID exists
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
   * Find a user by email address (case-insensitive)
   * 
   * @param email - The email address to search for
   * @param txContext - Optional transaction context
   * @returns The user with the matching email or null if not found
   */
  async findByEmail(email: string, txContext?: TransactionContext): Promise<User | null> {
    const session = this.getSession(txContext);
    return await this.collection.findOne(
      { email: email.toLowerCase() },
      { session }
    );
  }

  /**
   * Check if a user with the given email exists
   * 
   * @param email - The email address to check
   * @param txContext - Optional transaction context
   * @returns True if a user with this email exists, false otherwise
   */
  async emailExists(email: string, txContext?: TransactionContext): Promise<boolean> {
    const session = this.getSession(txContext);
    const count = await this.collection.countDocuments(
      { email: email.toLowerCase() },
      { limit: 1, session }
    );
    
    return count > 0;
  }

  /**
   * Update a user's password
   * 
   * @param id - The user's ID
   * @param password - The new hashed password
   * @param txContext - Optional transaction context
   * @returns The updated user
   * @throws Error if the user is not found
   */
  async updatePassword(
    id: string, 
    password: string, 
    txContext?: TransactionContext
  ): Promise<User> {
    return await this.update(id, { password, updatedAt: new Date() }, txContext);
  }
}