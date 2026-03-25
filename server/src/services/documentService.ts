import { getSupabaseAdmin } from '../db/supabaseAdmin.js';

export type DocumentRow = {
  id: string;
  chat_id: string;
  user_id: string | null;
  filename: string;
  mime_type: string;
  storage_path: string;
  extracted_text: string;
  created_at: string;
};

const MAX_CONTEXT_TOTAL = 200_000;

export async function listDocumentsForChat(chatId: string): Promise<DocumentRow[]> {
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from('documents')
    .select('*')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as DocumentRow[];
}

export async function insertDocument(input: {
  chatId: string;
  userId: string | null;
  filename: string;
  mimeType: string;
  storagePath: string;
  extractedText: string;
}): Promise<DocumentRow> {
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from('documents')
    .insert({
      chat_id: input.chatId,
      user_id: input.userId,
      filename: input.filename,
      mime_type: input.mimeType,
      storage_path: input.storagePath,
      extracted_text: input.extractedText.slice(0, 500_000),
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as DocumentRow;
}

export async function updateDocumentStoragePath(id: string, storagePath: string): Promise<void> {
  const db = getSupabaseAdmin();
  const { error } = await db.from('documents').update({ storage_path: storagePath }).eq('id', id);
  if (error) throw error;
}

export async function compileDocumentContext(chatId: string): Promise<string> {
  const docs = await listDocumentsForChat(chatId);
  if (!docs.length) return '';
  const perDoc = Math.max(8000, Math.floor(MAX_CONTEXT_TOTAL / docs.length));
  const parts = docs.map((d) => {
    const body = (d.extracted_text ?? '').slice(0, perDoc);
    return `--- Document: ${d.filename} ---\n${body}\n`;
  });
  return parts.join('\n').slice(0, MAX_CONTEXT_TOTAL);
}

export async function extractPlainText(buffer: Buffer, mime: string): Promise<string> {
  if (mime === 'text/plain' || mime === 'text/markdown' || mime === 'text/csv') {
    return buffer.toString('utf8');
  }
  if (mime === 'application/json') {
    return buffer.toString('utf8');
  }
  try {
    const s = buffer.toString('utf8');
    if (/[\x00-\x08\x0E-\x1F]/.test(s)) {
      return `[Binary file — upload .txt or .md for full text extraction. MIME: ${mime}]`;
    }
    return s;
  } catch {
    return `[Could not extract text. MIME: ${mime}]`;
  }
}
