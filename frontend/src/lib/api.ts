import axios from 'axios';
import { supabase } from './supabase';
import type { CreateLogEntryPayload, FoodSearchResult, LogEntry } from '../types';

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

export async function searchFood(query: string): Promise<FoodSearchResult[]> {
  const { data } = await api.get<FoodSearchResult[]>('/api/v1/food/search', {
    params: { q: query },
  });
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
