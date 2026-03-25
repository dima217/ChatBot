import type { ChatTurn } from './llm/types.js';

const MAX_DOCS_CHARS_IN_USER_TURN = 90_000;

export function attachDocsToLastUserMessage(
  turns: ChatTurn[],
  docContext: string
): ChatTurn[] {
  const trimmed = docContext.trim();
  if (!trimmed || !turns.length) return turns;
  let lastUser = -1;
  for (let i = turns.length - 1; i >= 0; i--) {
    if (turns[i]!.role === 'user') {
      lastUser = i;
      break;
    }
  }
  if (lastUser < 0) return turns;
  const block = trimmed.slice(0, MAX_DOCS_CHARS_IN_USER_TURN);
  const suffix = `\n\n----------\n[Uploaded files for this chat — use as factual context:]\n${block}`;
  return turns.map((t, i) =>
    i === lastUser ? { ...t, content: t.content + suffix } : t
  );
}
