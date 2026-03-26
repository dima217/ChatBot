import type { User } from '@supabase/supabase-js';

const TTL_MS = 45_000;
const MAX_ENTRIES = 300;

const cache = new Map<string, { user: User; expiresAt: number }>();

export function getCachedAuthUser(token: string): User | null {
  const row = cache.get(token);
  if (!row) return null;
  if (row.expiresAt <= Date.now()) {
    cache.delete(token);
    return null;
  }
  return row.user;
}

export function setCachedAuthUser(token: string, user: User): void {
  if (cache.size >= MAX_ENTRIES) {
    const oldest = cache.keys().next().value as string | undefined;
    if (oldest) cache.delete(oldest);
  }
  cache.set(token, { user, expiresAt: Date.now() + TTL_MS });
}
