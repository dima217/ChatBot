import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  CLIENT_ORIGIN: z.string().default('http://localhost:3000'),
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
