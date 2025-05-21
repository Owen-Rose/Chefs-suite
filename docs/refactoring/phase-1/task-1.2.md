# Task 1.2: Implement Recipe Repository

## Goal
Refactor the recipe repository to implement the new BaseRepository interface, ensuring all CRUD operations are standardized and follow best practices for data access.

## Background
The current recipe repository is commented out and needs to be reimplemented to use the new BaseRepository interface created in task 1.1. This will provide a consistent and standardized approach to recipe data access across the application.

## Implementation Steps

1. Create a new MongoDB implementation of the BaseRepository for recipes:
   ```typescript
   // repositories/implementations/MongoRecipeRepository.ts
   
   import { Collection, ObjectId } from "mongodb";
   import { Recipe } from "@/types/Recipe";
   import { BaseRepository } from "../base/BaseRepository";
   import { ListResult, QueryOptions, TransactionContext } from "../base/types";
   
   export class MongoRecipeRepository implements BaseRepository<Recipe> {
     constructor(private collection: Collection<Recipe>) {}
     
     // Implement all BaseRepository methods here
   }
   ```

2. Implement the `findAll` method with pagination support:
   ```typescript
   async findAll(options?: QueryOptions, txContext?: TransactionContext): Promise<ListResult<Recipe>> {
     const skip = options?.skip || 0;
     const limit = options?.limit || 10;
     const sort = options?.sort || { createdDate: -1 };
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
   async findById(id: string, txContext?: TransactionContext): Promise<Recipe | null> {
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
   ): Promise<ListResult<Recipe>> {
     const skip = options?.skip || 0;
     const limit = options?.limit || 10;
     const sort = options?.sort || { createdDate: -1 };
     
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
   async create(data: Omit<Recipe, '_id'>, txContext?: TransactionContext): Promise<Recipe> {
     const session = txContext?.session;
     
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
   ```

6. Implement the `createMany` method:
   ```typescript
   async createMany(data: Omit<Recipe, '_id'>[], txContext?: TransactionContext): Promise<Recipe[]> {
     if (data.length === 0) {
       return [];
     }
     
     const session = txContext?.session;
     
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
     const insertedIds = Object.values(result.insertedIds).map(id => id.toString());
     const filter = { _id: { $in: insertedIds.map(id => new ObjectId(id)) } };
     const inserted = await this.collection.find(filter, { session }).toArray();
     
     return inserted;
   }
   ```

7. Implement the `update` method:
   ```typescript
   async update(id: string, data: Partial<Recipe>, txContext?: TransactionContext): Promise<Recipe> {
     if (!ObjectId.isValid(id)) {
       throw new Error("Invalid recipe ID");
     }
     
     const session = txContext?.session;
     
     const result = await this.collection.findOneAndUpdate(
       { _id: new ObjectId(id) },
       { $set: data },
       { returnDocument: 'after', session }
     );
     
     if (!result) {
       throw new Error("Recipe not found");
     }
     
     return result;
   }
   ```

8. Implement the `upsert` method:
   ```typescript
   async upsert(
     filter: Record<string, any>,
     data: Partial<Recipe>,
     txContext?: TransactionContext
   ): Promise<Recipe> {
     const session = txContext?.session;
     
     const result = await this.collection.findOneAndUpdate(
       filter,
       {
         $set: data,
         $setOnInsert: {
           createdDate: new Date().toISOString()
         }
       },
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
   ```

9. Implement the `delete` method:
   ```typescript
   async delete(id: string, txContext?: TransactionContext): Promise<void> {
     if (!ObjectId.isValid(id)) {
       throw new Error("Invalid recipe ID");
     }
     
     const session = txContext?.session;
     
     const result = await this.collection.deleteOne(
       { _id: new ObjectId(id) },
       { session }
     );
     
     if (result.deletedCount === 0) {
       throw new Error("Recipe not found");
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

13. Create a factory function to get the repository instance:
    ```typescript
    // repositories/recipeRepository.ts
    
    import { connectToDatabase } from "@/lib/mongodb";
    import { BaseRepository } from "./base/BaseRepository";
    import { Recipe } from "@/types/Recipe";
    import { MongoRecipeRepository } from "./implementations/MongoRecipeRepository";
    
    let recipeRepository: BaseRepository<Recipe> | null = null;
    
    export async function getRecipeRepository(): Promise<BaseRepository<Recipe>> {
      if (!recipeRepository) {
        const { recipes } = await connectToDatabase();
        recipeRepository = new MongoRecipeRepository(recipes);
      }
      return recipeRepository;
    }
    ```

14. Create or update unit tests for the MongoRecipeRepository implementation in `__tests__/repositories/recipeRepository.test.ts`.

## Files to Create/Modify
- `repositories/implementations/MongoRecipeRepository.ts` (new file)
- `repositories/recipeRepository.ts` (update)
- `__tests__/repositories/recipeRepository.test.ts` (create or update)

## Verification Steps
1. Run TypeScript compiler to ensure no type errors
2. Run unit tests for the recipe repository
3. Test the repository functions by manually calling them in an API route
4. Verify compatibility with existing code that uses recipe repository

## Dependencies
- Task 1.1: Create Base Repository Interface (completed)

## Estimated Effort
Medium (3-4 hours)

## Notes
- Maintain compatibility with the existing Recipe type
- Use ObjectId for internal MongoDB operations, but expose string IDs in the public interface
- Handle edge cases like invalid IDs, not found documents, etc.
- Consider adding specific methods for recipe-related operations like searching by ingredients