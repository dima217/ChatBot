export function getPublicApiBase(): string {
  let s = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").trim();

  s = s.replace(/^[=]+/, "").trim();

  s = s.replace(/^https\/\//i, "https://");
  s = s.replace(/^http\/\//i, "http://");

  s = s.replace(/^https:\/\/=+https\/\//i, "https://");
  s = s.replace(/^https:\/\/=+(https:\/\/)/i, "$1");

  s = s.replace(/\/$/, "");

  if (!s) return "http://localhost:4000";

  if (/^https?:\/\//i.test(s)) return s;

  if (/^localhost(?::|$)|^127\.0\.0\.1(?::|$)/i.test(s)) return `http://${s}`;

  const railwayHost = s.match(/([a-z0-9][-a-z0-9]*\.up\.railway\.app)/i);
  if (railwayHost) return `https://${railwayHost[1]}`;

  return `https://${s}`;
}
