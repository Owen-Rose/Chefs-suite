import { Ingredient } from "./Ingredient";

export interface Recipe {
  _id?: string;
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
}
