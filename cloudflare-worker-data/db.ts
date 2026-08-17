import { neon } from '@neondatabase/serverless';
import type { Env } from './env';

export function db(env: Env) {
  return neon(env.DATABASE_URL);
}
