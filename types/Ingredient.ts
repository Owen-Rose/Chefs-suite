export interface Ingredient {
  id: number;
  vendor?: string;
  productName: string;
  name?: string; // Adding name property that is being used in tests
  quantity: number;
  unit: string;
}
