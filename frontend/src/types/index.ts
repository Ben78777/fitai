export interface FoodSearchResult {
  productName: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  // Actual serving size from API Ninjas — used by free-text mode to recover real totals
  servingSizeG: number;
}

export interface LogEntry {
  id: string;
  mealType: MealType;
  foodName: string;
  quantityG: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface CreateLogEntryPayload {
  date: string;           // ISO date string YYYY-MM-DD
  mealType: MealType;
  foodName: string;
  quantityG: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}
