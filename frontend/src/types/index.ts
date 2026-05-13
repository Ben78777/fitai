export interface FoodAnalysisItem {
  foodName: string;
  quantityG: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
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
