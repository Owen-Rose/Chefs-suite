# Task 1.4: Add Archive Repository

## Goal
Create a standardized Archive repository implementing the BaseRepository interface to provide consistent data access for the recipe archiving functionality.

## Background
The application includes an archive feature that allows recipes to be stored in collections for reference. Currently, there's no formal archive repository implementing the new BaseRepository pattern. This task will create a standardized repository for archives to ensure consistent data access.

## Implementation Steps

1. Create a MongoDB implementation of the BaseRepository for archives:
   ```typescript
   // repositories/implementations/MongoArchiveRepository.ts
   
   import { Collection, ObjectId } from "mongodb";
   import { Archive } from "@/types/Archive";
   import { BaseRepository } from "../base/BaseRepository";
   import { ListResult, QueryOptions, TransactionContext } from "../base/types";
   
   export class MongoArchiveRepository implements BaseRepository<Archive, string> {
     constructor(private collection: Collection<Archive>) {}
     
     // Implement all required BaseRepository methods here
   }
   ```

2. Implement the `findAll` method with pagination support:
   ```typescript
   async findAll(options?: QueryOptions, txContext?: TransactionContext): Promise<ListResult<Archive>> {
     const skip = options?.skip || 0;
     const limit = options?.limit || 10;
     const sort = options?.sort || { lastModifiedDate: -1 };
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
   async findById(id: string, txContext?: TransactionContext): Promise<Archive | null> {
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
   ): Promise<ListResult<Archive>> {
     const skip = options?.skip || 0;
     const limit = options?.limit || 10;
     const sort = options?.sort || { lastModifiedDate: -1 };
     
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
   async create(data: Omit<Archive, '_id'>, txContext?: TransactionContext): Promise<Archive> {
     const session = txContext?.session;
     
     const now = new Date();
     const archiveToInsert = {
       ...data,
       createdDate: data.createdDate || now,
       lastModifiedDate: data.lastModifiedDate || now
     };
     
     // Ensure ObjectId conversion
     if (typeof archiveToInsert.createdBy === 'string') {
       archiveToInsert.createdBy = new ObjectId(archiveToInsert.createdBy);
     }
     
     // Ensure recipe IDs are valid ObjectIds
     if (archiveToInsert.recipes && archiveToInsert.recipes.length > 0) {
       archiveToInsert.recipes = archiveToInsert.recipes.map(recipe => ({
         ...recipe,
         originalId: typeof recipe.originalId === 'string' 
           ? new ObjectId(recipe.originalId) 
           : recipe.originalId
       }));
     }
     
     const result = await this.collection.insertOne(archiveToInsert as any, { session });
     
     if (!result.acknowledged) {
       throw new Error("Failed to create archive");
     }
     
     const createdArchive = await this.collection.findOne(
       { _id: result.insertedId },
       { session }
     );
     
     if (!createdArchive) {
       throw new Error("Failed to retrieve created archive");
     }
     
     return createdArchive;
   }
   ```

6. Implement the `createMany` method:
   ```typescript
   async createMany(data: Omit<Archive, '_id'>[], txContext?: TransactionContext): Promise<Archive[]> {
     if (data.length === 0) {
       return [];
     }
     
     const session = txContext?.session;
     const now = new Date();
     
     const archivesToInsert = data.map(archive => {
       const preparedArchive = {
         ...archive,
         createdDate: archive.createdDate || now,
         lastModifiedDate: archive.lastModifiedDate || now
       };
       
       // Ensure ObjectId conversion
       if (typeof preparedArchive.createdBy === 'string') {
         preparedArchive.createdBy = new ObjectId(preparedArchive.createdBy);
       }
       
       // Ensure recipe IDs are valid ObjectIds
       if (preparedArchive.recipes && preparedArchive.recipes.length > 0) {
         preparedArchive.recipes = preparedArchive.recipes.map(recipe => ({
           ...recipe,
           originalId: typeof recipe.originalId === 'string' 
             ? new ObjectId(recipe.originalId) 
             : recipe.originalId
         }));
       }
       
       return preparedArchive;
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
   ```

7. Implement the `update` method:
   ```typescript
   async update(id: string, data: Partial<Archive>, txContext?: TransactionContext): Promise<Archive> {
     if (!ObjectId.isValid(id)) {
       throw new Error("Invalid archive ID");
     }
     
     const session = txContext?.session;
     
     // Prepare update data
     const updateData = {
       ...data,
       lastModifiedDate: new Date()
     };
     
     // Ensure ObjectId conversion for createdBy if it's being updated
     if (typeof updateData.createdBy === 'string') {
       updateData.createdBy = new ObjectId(updateData.createdBy);
     }
     
     // Ensure recipe IDs are valid ObjectIds if recipes are being updated
     if (updateData.recipes && updateData.recipes.length > 0) {
       updateData.recipes = updateData.recipes.map(recipe => ({
         ...recipe,
         originalId: typeof recipe.originalId === 'string' 
           ? new ObjectId(recipe.originalId) 
           : recipe.originalId
       }));
     }
     
     const result = await this.collection.findOneAndUpdate(
       { _id: new ObjectId(id) },
       { $set: updateData },
       { returnDocument: 'after', session }
     );
     
     if (!result) {
       throw new Error("Archive not found");
     }
     
     return result;
   }
   ```

8. Implement the `upsert` method:
   ```typescript
   async upsert(
     filter: Record<string, any>,
     data: Partial<Archive>,
     txContext?: TransactionContext
   ): Promise<Archive> {
     const session = txContext?.session;
     const now = new Date();
     
     // Prepare update data
     const updateData = {
       ...data,
       lastModifiedDate: now
     };
     
     // Ensure ObjectId conversion for createdBy if it's being updated
     if (typeof updateData.createdBy === 'string') {
       updateData.createdBy = new ObjectId(updateData.createdBy);
     }
     
     // Ensure recipe IDs are valid ObjectIds if recipes are being updated
     if (updateData.recipes && updateData.recipes.length > 0) {
       updateData.recipes = updateData.recipes.map(recipe => ({
         ...recipe,
         originalId: typeof recipe.originalId === 'string' 
           ? new ObjectId(recipe.originalId) 
           : recipe.originalId
       }));
     }
     
     const result = await this.collection.findOneAndUpdate(
       filter,
       {
         $set: updateData,
         $setOnInsert: {
           createdDate: now
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
   ```

9. Implement the `delete` method:
   ```typescript
   async delete(id: string, txContext?: TransactionContext): Promise<void> {
     if (!ObjectId.isValid(id)) {
       throw new Error("Invalid archive ID");
     }
     
     const session = txContext?.session;
     
     const result = await this.collection.deleteOne(
       { _id: new ObjectId(id) },
       { session }
     );
     
     if (result.deletedCount === 0) {
       throw new Error("Archive not found");
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

13. Add specialized methods for archive-specific operations:
    ```typescript
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
      const createdBy = new ObjectId(userId);
      return this.findByFilter({ createdBy }, options, txContext);
    }
    
    /**
     * Add a recipe to an archive
     * 
     * @param archiveId - The ID of the archive
     * @param recipe - The recipe to add
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
      
      const session = txContext?.session;
      
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
      if (!ObjectId.isValid(archiveId)) {
        throw new Error("Invalid archive ID");
      }
      
      const session = txContext?.session;
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
    ```

14. Create a factory function to get the repository instance:
    ```typescript
    // repositories/archiveRepository.ts
    
    import { connectToDatabase } from "@/lib/mongodb";
    import { BaseRepository } from "./base/BaseRepository";
    import { Archive } from "@/types/Archive";
    import { MongoArchiveRepository } from "./implementations/MongoArchiveRepository";
    
    let archiveRepository: BaseRepository<Archive> & MongoArchiveRepository | null = null;
    
    export async function getArchiveRepository(): Promise<BaseRepository<Archive> & MongoArchiveRepository> {
      if (!archiveRepository) {
        const { archives } = await connectToDatabase();
        archiveRepository = new MongoArchiveRepository(archives);
      }
      return archiveRepository;
    }
    ```

15. Create unit tests for the MongoArchiveRepository implementation in `__tests__/repositories/archiveRepository.test.ts`.

## Files to Create/Modify
- `repositories/implementations/MongoArchiveRepository.ts` (new file)
- `repositories/archiveRepository.ts` (new file)
- `__tests__/repositories/archiveRepository.test.ts` (new file)

## Verification Steps
1. Run TypeScript compiler to ensure no type errors
2. Run unit tests for the archive repository
3. Test the repository functions by manually calling them in an API route
4. Verify that archive-specific methods work correctly (findByCreator, addRecipe, removeRecipe)
5. Check that archives are properly saved with ObjectId conversions

## Dependencies
- Task 1.1: Create Base Repository Interface (completed)

## Estimated Effort
Medium (3-4 hours)

## Notes
- Ensure proper handling of nested recipe objects within archives
- Maintain the lastModifiedDate timestamp on all modifications
- Consider performance implications for large archives with many recipes
- Consider adding validation for recipe data when adding to archives
- Handle ObjectId conversion between the database and API layer