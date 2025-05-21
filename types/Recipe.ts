import { Ingredient } from "./Ingredient";
import { ObjectId } from "mongodb";

export interface Recipe {
  _id?: string;
  originalId?: string | ObjectId;
  name: string;
  createdDate: string;
  version: string;
  station: string;
  batchNumber: number;
  equipment: string[];
  ingredients: Ingredient[];
  yield: string;
  portionSize: string;
  portionsPerRecipe: string;
  procedure: string[];
  description?: string;
  foodCost?: number;
  prepTime?: number; // Adding properties used in tests
  cookTime?: number;
  servings?: number;
  createdBy?: ObjectId;
  archiveId?: ObjectId | null;
  archiveDate?: Date | null;
  importSource?: string;
  importedAt?: Date;
}
