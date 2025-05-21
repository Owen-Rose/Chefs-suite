# Task 1.3: Add User Repository

## Goal
Create a standardized User repository that implements the BaseRepository interface for consistent user data access across the application.

## Background
The application currently lacks a formal User repository. As part of the repository standardization effort, we need to create a User repository that follows the new BaseRepository pattern established in Task 1.1.

## Implementation Steps

1. Create a MongoDB implementation of the BaseRepository for users:
   ```typescript
   // repositories/implementations/MongoUserRepository.ts
   
   import { Collection, ObjectId } from "mongodb";
   import { User } from "@/types/User";
   import { BaseRepository } from "../base/BaseRepository";
   import { ListResult, QueryOptions, TransactionContext } from "../base/types";
   
   export class MongoUserRepository implements BaseRepository<User, string> {
     constructor(private collection: Collection<User>) {}
     
     // Implement all required BaseRepository methods here
   }
   ```

2. Implement the `findAll` method with pagination support:
   ```typescript
   async findAll(options?: QueryOptions, txContext?: TransactionContext): Promise<ListResult<User>> {
     const skip = options?.skip || 0;
     const limit = options?.limit || 10;
     const sort = options?.sort || { createdAt: -1 };
     const filter = options?.filter || {};
     
     const session = txContext?.session;
     
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
   ```

3. Implement the `findById` method:
   ```typescript
   async findById(id: string, txContext?: TransactionContext): Promise<User | null> {
     if (!ObjectId.isValid(id)) {
       return null;
     }
     
     const session = txContext?.session;
     return await this.collection.findOne(
       { _id: new ObjectId(id) },
       { session }
     );
   }
   ```

4. Implement the `findByFilter` method:
   ```typescript
   async findByFilter(
     filter: Record<string, any>,
     options?: QueryOptions,
     txContext?: TransactionContext
   ): Promise<ListResult<User>> {
     const skip = options?.skip || 0;
     const limit = options?.limit || 10;
     const sort = options?.sort || { createdAt: -1 };
     
     const session = txContext?.session;
     
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
   ```

5. Implement the `create` method:
   ```typescript
   async create(data: Omit<User, '_id'>, txContext?: TransactionContext): Promise<User> {
     const session = txContext?.session;
     
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
     
     const createdUser = await this.collection.findOne(
       { _id: result.insertedId },
       { session }
     );
     
     if (!createdUser) {
       throw new Error("Failed to retrieve created user");
     }
     
     return createdUser;
   }
   ```

6. Implement the `createMany` method:
   ```typescript
   async createMany(data: Omit<User, '_id'>[], txContext?: TransactionContext): Promise<User[]> {
     if (data.length === 0) {
       return [];
     }
     
     const session = txContext?.session;
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
   ```

7. Implement the `update` method:
   ```typescript
   async update(id: string, data: Partial<User>, txContext?: TransactionContext): Promise<User> {
     if (!ObjectId.isValid(id)) {
       throw new Error("Invalid user ID");
     }
     
     const session = txContext?.session;
     
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
   ```

8. Implement the `upsert` method:
   ```typescript
   async upsert(
     filter: Record<string, any>,
     data: Partial<User>,
     txContext?: TransactionContext
   ): Promise<User> {
     const session = txContext?.session;
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
   ```

9. Implement the `delete` method:
   ```typescript
   async delete(id: string, txContext?: TransactionContext): Promise<void> {
     if (!ObjectId.isValid(id)) {
       throw new Error("Invalid user ID");
     }
     
     const session = txContext?.session;
     
     const result = await this.collection.deleteOne(
       { _id: new ObjectId(id) },
       { session }
     );
     
     if (result.deletedCount === 0) {
       throw new Error("User not found");
     }
   }
   ```

10. Implement the `deleteMany` method:
    ```typescript
    async deleteMany(
      filter: Record<string, any>,
      txContext?: TransactionContext
    ): Promise<number> {
      const session = txContext?.session;
      
      const result = await this.collection.deleteMany(filter, { session });
      return result.deletedCount;
    }
    ```

11. Implement the `count` method:
    ```typescript
    async count(filter?: Record<string, any>, txContext?: TransactionContext): Promise<number> {
      const session = txContext?.session;
      return await this.collection.countDocuments(filter || {}, { session });
    }
    ```

12. Implement the `exists` method:
    ```typescript
    async exists(id: string, txContext?: TransactionContext): Promise<boolean> {
      if (!ObjectId.isValid(id)) {
        return false;
      }
      
      const session = txContext?.session;
      const count = await this.collection.countDocuments(
        { _id: new ObjectId(id) },
        { limit: 1, session }
      );
      
      return count > 0;
    }
    ```

13. Add specialized methods for user-specific operations:
    ```typescript
    /**
     * Find a user by email address
     * 
     * @param email - The email address to search for (case-insensitive)
     * @param txContext - Optional transaction context
     * @returns The user with the matching email or null if not found
     */
    async findByEmail(email: string, txContext?: TransactionContext): Promise<User | null> {
      const session = txContext?.session;
      return await this.collection.findOne(
        { email: email.toLowerCase() },
        { session }
      );
    }
    
    /**
     * Check if a user with the given email exists
     * 
     * @param email - The email address to check (case-insensitive)
     * @param txContext - Optional transaction context
     * @returns True if a user with this email exists, false otherwise
     */
    async emailExists(email: string, txContext?: TransactionContext): Promise<boolean> {
      const session = txContext?.session;
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
    ```

14. Create a factory function to get the repository instance:
    ```typescript
    // repositories/userRepository.ts
    
    import { connectToDatabase } from "@/lib/mongodb";
    import { BaseRepository } from "./base/BaseRepository";
    import { User } from "@/types/User";
    import { MongoUserRepository } from "./implementations/MongoUserRepository";
    
    let userRepository: BaseRepository<User> & MongoUserRepository | null = null;
    
    export async function getUserRepository(): Promise<BaseRepository<User> & MongoUserRepository> {
      if (!userRepository) {
        const { users } = await connectToDatabase();
        userRepository = new MongoUserRepository(users);
      }
      return userRepository;
    }
    ```

15. Create unit tests for the MongoUserRepository implementation in `__tests__/repositories/userRepository.test.ts`.

## Files to Create/Modify
- `repositories/implementations/MongoUserRepository.ts` (new file)
- `repositories/userRepository.ts` (new file)
- `__tests__/repositories/userRepository.test.ts` (new file)

## Verification Steps
1. Run TypeScript compiler to ensure no type errors
2. Run unit tests for the user repository
3. Test the repository functions by manually calling them in an API route or component
4. Verify that user-specific methods work correctly (findByEmail, emailExists, updatePassword)
5. Check that users are properly saved with lowercase email addresses

## Dependencies
- Task 1.1: Create Base Repository Interface (completed)

## Estimated Effort
Medium (3-4 hours)

## Notes
- Ensure all email addresses are stored in lowercase for consistent lookups
- Maintain audit fields (createdAt, updatedAt) automatically
- Handle ObjectId conversion between the database and API layer
- Consider adding methods for role-based user queries if needed
- Password fields should only contain hashed passwords, never plaintext