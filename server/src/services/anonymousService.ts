import { getSupabaseAdmin } from '../db/supabaseAdmin.js';
import { env } from '../config/env.js';
import { ApiError } from '../middleware/errorHandler.js';

export const ANON_COOKIE = 'anon_session_id';

type Row = { session_id: string; user_messages_used: number };
const USAGE_CACHE_TTL_MS = 15_000;
const usageCache = new Map<string, { used: number; expiresAt: number }>();

function setUsageCache(sessionId: string, used: number): void {
  usageCache.set(sessionId, { used, expiresAt: Date.now() + USAGE_CACHE_TTL_MS });
}

export async function ensureAnonCookieRow(sessionId: string): Promise<void> {
  const db = getSupabaseAdmin();
  await db.from('anonymous_usage').upsert(
    { session_id: sessionId, user_messages_used: 0, updated_at: new Date().toISOString() },
    { onConflict: 'session_id', ignoreDuplicates: true }
  );
}

export async function getAnonUsage(sessionId: string): Promise<number> {
  const cached = usageCache.get(sessionId);
  if (cached && cached.expiresAt > Date.now()) return cached.used;
  if (cached) usageCache.delete(sessionId);
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from('anonymous_usage')
    .select('user_messages_used')
    .eq('session_id', sessionId)
    .maybeSingle();
  if (error) throw error;
  const used = (data as Row | null)?.user_messages_used ?? 0;
  setUsageCache(sessionId, used);
  return used;
}

export async function incrementAnonUsage(sessionId: string, currentUsed?: number): Promise<number> {
  const db = getSupabaseAdmin();
  const current = currentUsed ?? (await getAnonUsage(sessionId));
  const next = current + 1;
  const { error } = await db.from('anonymous_usage').upsert({
    session_id: sessionId,
    user_messages_used: next,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
  setUsageCache(sessionId, next);
  return next;
}

export async function assertAnonCanSend(sessionId: string): Promise<number> {
  const used = await getAnonUsage(sessionId);
  if (used >= env.ANON_FREE_USER_MESSAGES) {
    throw new ApiError(
      403,
      `Anonymous limit reached (${env.ANON_FREE_USER_MESSAGES} messages). Sign in to continue.`,
      'ANON_LIMIT'
    );
  }
  return used;
}
