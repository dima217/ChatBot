export type ChatTurn = {
  role: 'user' | 'assistant' | 'system';
  content: string;
  imageUrls?: string[];
};

export type StreamChunk = { text: string };

export type LlmProviderId = 'openai' | 'gemini';
