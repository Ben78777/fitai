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

export interface UserProfile {
  id: string;
  name: string;
  gender: string;
  age: number;
  weightKg: number;
  heightCm: number;
  goal: string;
  calorieTargetOffset: number;
}

export interface CreateProfilePayload {
  name: string;
  gender: string;
  age: number;
  weightKg: number;
  heightCm: number;
  goal: string;
  calorieTargetOffset?: number;
}

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
