import { ObjectId } from 'mongodb';
import { Ingredient } from './ingredient';

export interface Recipe {
  _id?: ObjectId;
  originalId?: ObjectId;
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
  importSource?: string;
  importedAt?: Date;
} 