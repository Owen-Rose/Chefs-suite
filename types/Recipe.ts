export interface Ingredient {
  id: number;
  vendor?: string;
  productName: string;
  quantity: number;
  unit: string;
}

export interface Recipe {
  id: number;
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
}
