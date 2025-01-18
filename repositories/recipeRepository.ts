// import { Recipe } from "@/types/Recipe";
// import { Collection, Db, ObjectId } from "mongodb";

// export class RecipeRepository {
//     private collection: Collection<Recipe>;

//     constructor(db: Db) {
//         this.collection = db.collection<Recipe>("recipes");
//     }

//     async findAll(): Promise<Recipe[]> {
//         return await this.collection.find({}).toArray();
//     }

//     async findById(id: string): Promise<Recipe | null> {
//         return await this.collection.findOne({ _id: new ObjectId(id) });
//     }

//     async create(recipe: Omit<Recipe, "_id">): Promise<Recipe> {
//         const result = await this.collection.insertOne({
//             ...recipe,
//             _id: new ObjectId()
//         } as Recipe);

//         const created = await this.findById(result.insertedId.toString());
//         if (!created) {
//             throw new Error("Failed to create recipe");
//         }
//         return created;
//     }

//     async update(id: string, recipe: Partial<Recipe>): Promise<Recipe> {
//         const result = await this.collection.findOneAndUpdate(
//             { _id: new ObjectId(id) },
//             { $set: recipe },
//             { returnDocument: 'after' }
//         );

//         if (!result) {
//             throw new Error("Recipe not found");
//         }
//         return result;
//     }

//     async delete(id: string): Promise<void> {
//         const result = await this.collection.deleteOne({ _id: new ObjectId(id) });
//         if (result.deletedCount === 0) {
//             throw new Error("Recipe not found");
//         }
//     }
// }