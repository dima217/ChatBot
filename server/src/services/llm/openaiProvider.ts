import OpenAI from 'openai';
import type { ChatTurn, StreamChunk } from './types.js';

const MODEL = 'gpt-4o-mini';

export function createOpenAiStreamer(apiKey: string) {
  const client = new OpenAI({ apiKey });

  return {
    async *stream(
      systemPrompt: string,
      history: ChatTurn[]
    ): AsyncGenerator<StreamChunk, void, unknown> {
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        { role: 'system', content: systemPrompt },
      ];
      for (const t of history) {
        if (t.role === 'system') continue;
        if (t.role === 'assistant') {
          messages.push({ role: 'assistant', content: t.content });
          continue;
        }
        if (t.imageUrls?.length) {
          const parts: OpenAI.Chat.ChatCompletionContentPart[] = [{ type: 'text', text: t.content }];
          for (const url of t.imageUrls) {
            parts.push({ type: 'image_url', image_url: { url } });
          }
          messages.push({ role: 'user', content: parts });
        } else {
          messages.push({ role: 'user', content: t.content });
        }
      }
      const stream = await client.chat.completions.create({
        model: MODEL,
        messages,
        stream: true,
      });
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content ?? '';
        if (text) yield { text };
      }
    },
  };
}
