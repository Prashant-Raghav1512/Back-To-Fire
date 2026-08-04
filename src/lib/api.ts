import { exercises as fallbackExercises, programs as fallbackPrograms } from '@/data/content';
import type { Exercise, Program } from '@/data/types';

const API_BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

async function getJson<T>(path: string, fallback: T): Promise<T> {
  if (!API_BASE) return fallback;
  try {
    const res = await fetch(`${API_BASE}${path}`);
    if (!res.ok) throw new Error(`Request to ${path} failed: ${res.status}`);
    return (await res.json()) as T;
  } catch (err) {
    console.warn(`Falling back to bundled data for ${path}`, err);
    return fallback;
  }
}

export function fetchExercises(): Promise<Exercise[]> {
  return getJson('/api/exercises', fallbackExercises);
}

export function fetchPrograms(): Promise<Program[]> {
  return getJson('/api/programs', fallbackPrograms);
}

export interface ContactPayload {
  name: string;
  email: string;
  message: string;
}

export async function submitContact(payload: ContactPayload): Promise<void> {
  if (!API_BASE) {
    throw new Error('The contact API is not configured (VITE_API_URL is unset).');
  }
  const res = await fetch(`${API_BASE}/api/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body: { error?: string } = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed with status ${res.status}`);
  }
}
