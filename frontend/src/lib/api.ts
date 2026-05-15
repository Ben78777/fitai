import axios from 'axios';
import { supabase } from './supabase';
import type { CreateLogEntryPayload, CreateProfilePayload, FoodAnalysisItem, LogEntry, UserProfile } from '../types';

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
