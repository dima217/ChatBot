import { getSupabaseAdmin } from '../db/supabaseAdmin.js';
import { randomUUID } from 'crypto';

const BUCKET = 'chat-uploads';

export async function uploadBuffer(
  pathPrefix: string,
  buffer: Buffer,
  contentType: string
): Promise<{ path: string; publicUrl: string }> {
  const db = getSupabaseAdmin();
  const path = `${pathPrefix}/${randomUUID()}`;
  const { error } = await db.storage.from(BUCKET).upload(path, buffer, {
    contentType,
    upsert: false,
  });
  if (error) throw error;
  const { data } = db.storage.from(BUCKET).getPublicUrl(path);
  return { path, publicUrl: data.publicUrl };
}
