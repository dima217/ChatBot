/** NEXT_PUBLIC_* is inlined at build time. Normalizes Railway vars when `https://` was omitted. */
export function getPublicApiBase(): string {
  const raw = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").trim();
  const base = raw.replace(/\/$/, "");
  if (!base) return "http://localhost:4000";
  if (/^https?:\/\//i.test(base)) return base;
  if (/^localhost(?::|$)|^127\.0\.0\.1(?::|$)/i.test(base)) return `http://${base}`;
  return `https://${base}`;
}
