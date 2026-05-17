import axios from 'axios';
import { supabase } from './supabase';
import type { AnalyticsData, ChatPayload, ChatResponse, CreateLogEntryPayload, CreateProfilePayload, FoodAnalysisItem, LogEntry, PredictResponse, ProgressData, UpdateProfilePayload, UserProfile, WeightLogEntry } from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

// Attach the Supabase session JWT to every request
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

export async function analyzeFood(query: string): Promise<FoodAnalysisItem[]> {
  const { data } = await api.post<FoodAnalysisItem[]>('/api/v1/food/analyze', { query });
  return data;
}

export async function analyzeFoodImage(imageBase64: string, mimeType: string): Promise<FoodAnalysisItem[]> {
  const { data } = await api.post<FoodAnalysisItem[]>('/api/v1/food/analyze-image', { imageBase64, mimeType });
  return data;
}

export async function getLog(date: string): Promise<LogEntry[]> {
  const { data } = await api.get<LogEntry[]>('/api/v1/log', {
    params: { date },
  });
  return data;
}

export async function addLogEntry(payload: CreateLogEntryPayload): Promise<LogEntry> {
  const { data } = await api.post<LogEntry>('/api/v1/log', payload);
  return data;
}

export async function removeLogEntry(id: string): Promise<void> {
  await api.delete(`/api/v1/log/${id}`);
}

// ── Profile ────────────────────────────────────────────────────────

/** Returns the current user's profile. Throws with status 404 if not found (onboarding needed). */
export async function getProfile(): Promise<UserProfile> {
  const { data } = await api.get<UserProfile>('/api/v1/profile');
  return data;
}

export async function createProfile(payload: CreateProfilePayload): Promise<UserProfile> {
  const { data } = await api.post<UserProfile>('/api/v1/profile', payload);
  return data;
}

export async function patchProfile(payload: UpdateProfilePayload): Promise<UserProfile> {
  const { data } = await api.patch<UserProfile>('/api/v1/profile', payload);
  return data;
}

// ── Progress ───────────────────────────────────────────────────────

/** Fetches progress for the given date (defaults to today if omitted). */
export async function getProgress(date?: string): Promise<ProgressData> {
  const { data } = await api.get<ProgressData>('/api/v1/progress', {
    params: date ? { date } : undefined,
  });
  return data;
}

// ── Chat ───────────────────────────────────────────────────────────

export async function sendChatMessage(payload: ChatPayload): Promise<ChatResponse> {
  const { data } = await api.post<ChatResponse>('/api/v1/chat', payload);
  return data;
}

// ── Weight Logging ─────────────────────────────────────────────────

export async function logWeight(weightKg: number): Promise<WeightLogEntry> {
  const { data } = await api.post<WeightLogEntry>('/api/v1/weight', { weightKg });
  return data;
}

export async function getWeightLogs(): Promise<WeightLogEntry[]> {
  const { data } = await api.get<WeightLogEntry[]>('/api/v1/weight');
  return data;
}

/** Returns the most recent weight log, or null if none exists. */
export async function getLatestWeightLog(): Promise<WeightLogEntry | null> {
  const { data } = await api.get<WeightLogEntry | Record<string, never>>('/api/v1/weight/latest');
  // Backend returns {} when no log exists — treat empty object as null
  return 'id' in data ? (data as WeightLogEntry) : null;
}

/** Returns true when the user hasn't logged weight in 7+ days. */
export async function checkWeightNudge(): Promise<boolean> {
  const { data } = await api.get<{ showNudge: boolean }>('/api/v1/weight/nudge');
  return data.showNudge;
}

// ── Analytics ──────────────────────────────────────────────────────

/** days=0 → all time; 7/30/90 → last N days */
export async function getAnalytics(days: number): Promise<AnalyticsData> {
  const { data } = await api.get<AnalyticsData>('/api/v1/analytics', { params: { days } });
  return data;
}

/** Fetch weight prediction; days = projection horizon in days */
export async function postPredict(days: number): Promise<PredictResponse> {
  const { data } = await api.post<PredictResponse>('/api/v1/predict', null, { params: { days } });
  return data;
}
