const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export type LlmProvider = "openai" | "gemini";

export type Chat = {
  id: string;
  user_id: string | null;
  title: string;
  anonymous_session_id: string | null;
  created_at: string;
  updated_at: string;
};

export type Message = {
  id: string;
  chat_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  image_urls: string[];
  provider: string | null;
  created_at: string;
};

export type ChatListResponse = {
  chats: Chat[];
  anonymousSessionId: string | null;
  anonymousUsage: { used: number; limit: number; remaining: number } | null;
};

function authHeaders(token: string | null): HeadersInit {
  const h: HeadersInit = { "Content-Type": "application/json" };
  if (token) {
    (h as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }
  return h;
}

export type ChatDoc = {
  id: string;
  filename: string;
  mime_type: string;
  created_at: string;
};

export type StreamHandlers = {
  onUserMessage: (m: Message) => void;
  onToken: (t: string) => void;
  onDone: (m: Message) => void;
  onError: (msg: string) => void;
  onUnauthorized?: () => void;
};

export async function sendMessageStream(
  token: string | null,
  chatId: string,
  body: {
    content: string;
    imageUrls?: string[];
    provider: LlmProvider;
    stream?: boolean;
  },
  handlers: StreamHandlers
) {
  const res = await fetch(
    `${API_BASE}/api/chats/${chatId}/messages`,
    {
      method: "POST",
      credentials: "include",
      headers: authHeaders(token),
      body: JSON.stringify({ ...body, stream: true }),
    }
  );
  if (!res.ok) {
    if (res.status === 401 && handlers.onUnauthorized) handlers.onUnauthorized();
    let msg = res.statusText;
    try {
      const j = (await res.json()) as { error?: string };
      if (j.error) msg = j.error;
    } catch {
      /* ignore */
    }
    handlers.onError(msg);
    return;
  }
  const reader = res.body?.getReader();
  const dec = new TextDecoder();
  if (!reader) {
    handlers.onError("No response body");
    return;
  }
  let buf = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let idx: number;
    while ((idx = buf.indexOf("\n\n")) >= 0) {
      const chunk = buf.slice(0, idx);
      buf = buf.slice(idx + 2);
      const lines = chunk.split("\n");
      let event = "message";
      let data = "";
      for (const line of lines) {
        if (line.startsWith("event: ")) event = line.slice(7).trim();
        else if (line.startsWith("data: "))
          data += line.slice(6);
      }
      if (!data) continue;
      try {
        const parsed = JSON.parse(data) as Record<string, unknown>;
        if (event === "user_message")
          handlers.onUserMessage(parsed as unknown as Message);
        else if (event === "token" && typeof parsed.text === "string")
          handlers.onToken(parsed.text);
        else if (event === "done")
          handlers.onDone(parsed.message as Message);
        else if (event === "error")
          handlers.onError(String(parsed.message ?? "Error"));
      } catch {
        /* ignore parse */
      }
    }
  }
}
