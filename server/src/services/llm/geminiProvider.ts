import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../../config/env.js';
import type { ChatTurn, StreamChunk } from './types.js';

function partsForTurn(turn: ChatTurn): { text?: string; inlineData?: { mimeType: string; data: string } }[] {
  const parts: { text?: string; inlineData?: { mimeType: string; data: string } }[] = [];
  if (turn.content.trim()) {
    parts.push({ text: turn.content });
  }
  for (const url of turn.imageUrls ?? []) {
    const m = /^data:([^;]+);base64,(.+)$/i.exec(url);
    if (m) {
      parts.push({ inlineData: { mimeType: m[1], data: m[2] } });
    } else {
      parts.push({
        text: `\n[For Gemini use pasted image as data URL; skipping URL]: ${url.slice(0, 80)}…\n`,
      });
    }
  }
  if (!parts.length) {
    parts.push({ text: '…' });
  }
  return parts;
}

export function createGeminiStreamer(apiKey: string) {
  const genAI = new GoogleGenerativeAI(apiKey);

  return {
    async *stream(
      systemPrompt: string,
      history: ChatTurn[]
    ): AsyncGenerator<StreamChunk, void, unknown> {
      const contents: { role: 'user' | 'model'; parts: ReturnType<typeof partsForTurn> }[] = [];
      for (const t of history) {
        if (t.role === 'system') continue;
        const role = t.role === 'assistant' ? 'model' : 'user';
        contents.push({ role, parts: partsForTurn(t) });
      }
      const model = genAI.getGenerativeModel({
        model: env.GEMINI_MODEL,
        systemInstruction: systemPrompt,
      });
      const result = await model.generateContentStream({
        contents: contents as import('@google/generative-ai').Content[],
      });
      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) yield { text };
      }
    },
  };
}
