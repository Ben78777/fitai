export interface FoodAnalysisItem {
  foodName: string;
  quantityG: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  // Micronutrients — null when AI had no data for this food
  fiberG?: number | null;
  sugarG?: number | null;
  sodiumMg?: number | null;
  potassiumMg?: number | null;
  vitaminCMg?: number | null;
  vitaminDMcg?: number | null;
  calciumMg?: number | null;
  ironMg?: number | null;
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
  // Micronutrients — null/absent for entries logged before micronutrient support
  fiberG?: number | null;
  sugarG?: number | null;
  sodiumMg?: number | null;
  potassiumMg?: number | null;
  vitaminCMg?: number | null;
  vitaminDMcg?: number | null;
  calciumMg?: number | null;
  ironMg?: number | null;
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
  weightKg?: number;
  age?: number;
  goal?: string;
  activityLevel?: string;
  calorieTargetOffset?: number;
}

export interface ProgressData {
  dailyCalorieTarget: number;
  todayCalories: number;
  todaySurplusDeficit: number;        // positive = surplus, negative = deficit
  accumulatedSurplusDeficit: number;
  estimatedWeightChangeKg: number;    // positive = gain, negative = loss
  goal: string;                       // "cutting" | "bulking" | "maintenance"
  calorieTargetOffset: number;        // current offset — for the inline editor
  tdee: number;                       // TDEE before offset — exposed for chatbot context
  weightKg: number;                   // user weight — for macro recommendation display
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatPayload {
  message: string;
  history: ChatMessage[];
}

export interface ChatResponse {
  reply: string;
}

// ── Weight Logging ─────────────────────────────────────────────────

export interface WeightLogEntry {
  id: string;
  weightKg: number;
  loggedAt: string; // ISO date string YYYY-MM-DD
}

// ── Analytics ──────────────────────────────────────────────────────

export interface DailyCalorieEntry {
  date: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export interface WeightEntry {
  date: string;
  weightKg: number;
}

export interface AnalyticsData {
  dailyCalories: DailyCalorieEntry[];
  weightLogs: WeightEntry[];
  averageCalories: number;
  calorieTarget: number;
}

// ── Weight Prediction ──────────────────────────────────────────────

export interface ProjectionPoint {
  date: string;
  actual: number | null;   // null for future dates
  predicted: number;
}

export interface PredictResponse {
  currentWeight: number;
  predictedWeight: number;
  estimatedChangeKg: number;   // negative = loss, positive = gain
  averageDailyDeficit: number; // positive = deficit, negative = surplus
  projectionDays: number;
  projectionPoints: ProjectionPoint[];
  goal: string;                // "cutting" | "bulking" | "maintenance"
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
  // Micronutrients — omit or pass null when not available
  fiberG?: number | null;
  sugarG?: number | null;
  sodiumMg?: number | null;
  potassiumMg?: number | null;
  vitaminCMg?: number | null;
  vitaminDMcg?: number | null;
  calciumMg?: number | null;
  ironMg?: number | null;
}
