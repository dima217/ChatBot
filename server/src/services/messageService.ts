import { getSupabaseAdmin } from '../db/supabaseAdmin.js';

export type MessageRow = {
  id: string;
  chat_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  image_urls: string[];
  provider: string | null;
  created_at: string;
};

export async function listMessages(chatId: string): Promise<MessageRow[]> {
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from('messages')
    .select('*')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as MessageRow[];
}

export async function insertMessage(input: {
  chatId: string;
  role: MessageRow['role'];
  content: string;
  imageUrls?: string[];
  provider?: string | null;
}): Promise<MessageRow> {
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from('messages')
    .insert({
      chat_id: input.chatId,
      role: input.role,
      content: input.content,
      image_urls: input.imageUrls ?? [],
      provider: input.provider ?? null,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as MessageRow;
}

export async function buildContextFromHistory(
  chatId: string,
  maxMessages = 30
): Promise<{ role: 'user' | 'assistant' | 'system'; content: string; imageUrls: string[] }[]> {
  const rows = await listMessages(chatId);
  return rows.slice(-maxMessages).map((r) => ({
    role: r.role,
    content: r.content,
    imageUrls: r.image_urls ?? [],
  }));
}
