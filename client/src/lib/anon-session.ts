const ANON_SESSION_KEY = "chatbot_anon_session_id";

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export function getAnonSessionId(): string | null {
  if (!canUseStorage()) return null;
  const v = localStorage.getItem(ANON_SESSION_KEY)?.trim();
  return v || null;
}

export function ensureAnonSessionId(): string | null {
  if (!canUseStorage()) return null;
  let sid = getAnonSessionId();
  if (!sid) {
    sid = crypto.randomUUID();
    localStorage.setItem(ANON_SESSION_KEY, sid);
  }
  return sid;
}

export function setAnonSessionId(sid: string | null | undefined): void {
  if (!canUseStorage()) return;
  const v = sid?.trim();
  if (v) localStorage.setItem(ANON_SESSION_KEY, v);
}
