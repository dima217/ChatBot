import { env } from '../../config/env.js';
import { ApiError } from '../../middleware/errorHandler.js';
import type { ChatTurn, LlmProviderId, StreamChunk } from './types.js';
import { createOpenAiStreamer } from './openaiProvider.js';
import { createGeminiStreamer } from './geminiProvider.js';

export type { ChatTurn, LlmProviderId, StreamChunk };

function getStreamer(provider: LlmProviderId) {
  if (provider === 'openai') {
    if (!env.OPENAI_API_KEY?.length) {
      throw new ApiError(503, 'OpenAI is not configured (OPENAI_API_KEY)');
    }
    return createOpenAiStreamer(env.OPENAI_API_KEY);
  }
  if (!env.GOOGLE_AI_API_KEY?.length) {
    throw new ApiError(503, 'Gemini is not configured (GOOGLE_AI_API_KEY)');
  }
  return createGeminiStreamer(env.GOOGLE_AI_API_KEY);
}

export async function* streamCompletion(
  provider: LlmProviderId,
  systemPrompt: string,
  history: ChatTurn[]
): AsyncGenerator<StreamChunk, void, unknown> {
  const streamer = getStreamer(provider);
  yield* streamer.stream(systemPrompt, history);
}

export function resolveProvider(requested?: string | null): LlmProviderId {
  const p = (requested || env.DEFAULT_LLM_PROVIDER) as LlmProviderId;
  if (p !== 'openai' && p !== 'gemini') return env.DEFAULT_LLM_PROVIDER;
  return p;
}
