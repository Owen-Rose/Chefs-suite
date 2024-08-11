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
  archiveId?: ObjectId | null;
  archiveDate?: Date | null;
}
