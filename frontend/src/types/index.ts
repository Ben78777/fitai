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
  activityLevel: string;
}

export interface CreateProfilePayload {
  name: string;
  gender: string;
  age: number;
  weightKg: number;
  heightCm: number;
  goal: string;
  activityLevel: string;
  calorieTargetOffset?: number;
}

export interface UpdateProfilePayload {
  calorieTargetOffset: number;
}

export interface ProgressData {
  dailyCalorieTarget: number;
  todayCalories: number;
  todaySurplusDeficit: number;        // positive = surplus, negative = deficit
  accumulatedSurplusDeficit: number;
  estimatedWeightChangeKg: number;    // positive = gain, negative = loss
  goal: string;                       // "cutting" | "bulking" | "maintenance"
  calorieTargetOffset: number;        // current offset — for the inline editor
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
