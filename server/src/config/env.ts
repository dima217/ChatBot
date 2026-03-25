import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

/** CORS / Socket.io must match browser Origin; Railway users often omit the scheme. */
function normalizeWebOrigin(raw: string): string {
  const s = raw.trim().replace(/\/$/, '');
  if (!s) return 'http://localhost:3000';
  if (/^https?:\/\//i.test(s)) return s;
  if (/^localhost(?::|$)|^127\.0\.0\.1(?::|$)/i.test(s)) return `http://${s}`;
  return `https://${s}`;
}

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  CLIENT_ORIGIN: z
    .string()
    .default('http://localhost:3000')
    .transform(normalizeWebOrigin),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  OPENAI_API_KEY: z.string().optional(),
  GOOGLE_AI_API_KEY: z.string().optional(),
  /** @see https://ai.google.dev/gemini-api/docs/models/gemini */
  GEMINI_MODEL: z.string().default('gemini-2.5-flash'),
  DEFAULT_LLM_PROVIDER: z.enum(['openai', 'gemini']).default('openai'),
  ANON_FREE_USER_MESSAGES: z.coerce.number().default(3),
});

export type Env = z.infer<typeof schema>;

export const env: Env = schema.parse({
  ...process.env,
});
