import { getSupabaseAdmin } from '../db/supabaseAdmin.js';
import { ApiError } from '../middleware/errorHandler.js';

export const DEFAULT_CHAT_TITLE = 'New Chat';

const PLACEHOLDER_TITLE_NORMALIZED = new Set(['new chat']);

export function isPlaceholderChatTitle(title: string): boolean {
  return PLACEHOLDER_TITLE_NORMALIZED.has(title.trim().toLowerCase());
}

export function titleFromFirstUserMessage(text: string, maxLen = 120): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  const firstLine = normalized.split('\n')[0]?.trim() ?? '';
  const base = firstLine || normalized;
  if (!base) return DEFAULT_CHAT_TITLE;
  if (base.length <= maxLen) return base;
  return `${base.slice(0, Math.max(0, maxLen - 1))}…`;
}

export type ChatRow = {
  id: string;
  user_id: string | null;
  title: string;
  anonymous_session_id: string | null;
  created_at: string;
  updated_at: string;
};

export async function listChats(userId: string): Promise<ChatRow[]> {
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from('chats')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return data as ChatRow[];
}

export async function listChatsAnonymous(sessionId: string): Promise<ChatRow[]> {
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from('chats')
    .select('*')
    .eq('anonymous_session_id', sessionId)
    .is('user_id', null)
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return data as ChatRow[];
}

export async function createChat(opts: {
  userId?: string | null;
  anonymousSessionId?: string | null;
  title?: string;
}): Promise<ChatRow> {
  const db = getSupabaseAdmin();
  const row = {
    title: opts.title ?? DEFAULT_CHAT_TITLE,
    user_id: opts.userId ?? null,
    anonymous_session_id: opts.anonymousSessionId ?? null,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await db.from('chats').insert(row).select('*').single();
  if (error) throw error;
  return data as ChatRow;
}

export async function getChat(
  id: string,
  opts: { userId?: string; anonymousSessionId?: string }
): Promise<ChatRow> {
  const db = getSupabaseAdmin();
  const { data, error } = await db.from('chats').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!data) throw new ApiError(404, 'Chat not found');
  const chat = data as ChatRow;
  if (opts.userId && chat.user_id === opts.userId) return chat;
  if (
    opts.anonymousSessionId &&
    chat.anonymous_session_id === opts.anonymousSessionId &&
    !chat.user_id
  ) {
    return chat;
  }
  throw new ApiError(404, 'Chat not found');
}

export async function updateChatTitle(
  id: string,
  userId: string,
  title: string
): Promise<ChatRow> {
  await getChat(id, { userId });
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from('chats')
    .update({ title, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data as ChatRow;
}

export async function deleteChat(id: string, userId: string): Promise<void> {
  await getChat(id, { userId });
  const db = getSupabaseAdmin();
  const { error } = await db.from('chats').delete().eq('id', id);
  if (error) throw error;
}

export async function deleteChatAnonymous(id: string, sessionId: string): Promise<void> {
  await getChat(id, { anonymousSessionId: sessionId });
  const db = getSupabaseAdmin();
  const { error } = await db.from('chats').delete().eq('id', id);
  if (error) throw error;
}

export async function touchChat(id: string): Promise<void> {
  const db = getSupabaseAdmin();
  await db.from('chats').update({ updated_at: new Date().toISOString() }).eq('id', id);
}

/** If the chat still has the placeholder title, set it from the first user message. */
export async function updateChatTitleIfPlaceholder(
  chatId: string,
  firstUserLabel: string
): Promise<boolean> {
  const db = getSupabaseAdmin();
  const { data, error } = await db.from('chats').select('title').eq('id', chatId).maybeSingle();
  if (error) throw error;
  if (!data) return false;
  const current = (data as Pick<ChatRow, 'title'>).title;
  if (!isPlaceholderChatTitle(current)) return false;
  const nextTitle = titleFromFirstUserMessage(firstUserLabel);
  const { error: upErr } = await db
    .from('chats')
    .update({ title: nextTitle, updated_at: new Date().toISOString() })
    .eq('id', chatId);
  if (upErr) throw upErr;
  return true;
}
