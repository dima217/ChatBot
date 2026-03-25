Full-stack demo: **Next.js** UI (TanStack Query, Tailwind, Radix-based components), **Express** REST API + Socket.io, **Supabase Postgres** via the **service role only** (no DB access from the browser except what your API exposes). Supports **streaming** completions from **OpenAI** and/or **Gemini**, **anonymous** usage (cookie session, capped messages), **document uploads** for prompt context, and **images** in messages.

## Architecture

| Layer | Responsibility |
|--------|----------------|
| `client/` | React UI; all data via `fetch` to Express (`NEXT_PUBLIC_API_URL`). No Supabase DB calls in components. |
| `server/` | HTTP + WebSocket auth, validation, LLM streaming, Supabase Admin (Postgres + Storage). |
| `supabase/schema.sql` | Tables to run once in the Supabase SQL editor. |

Realtime **chat list sync** uses **Socket.io** on the same Express server (avoids exposing anon Supabase reads).

## Prerequisites

- Node 20+
- A [Supabase](https://supabase.com) project
- At least one LLM key: `OPENAI_API_KEY` and/or `GOOGLE_AI_API_KEY`

## Supabase setup

1. In **SQL Editor**, run **`supabase/schema.sql` in full** (tables + `chat-uploads` bucket + Storage RLS policies).  
   Without the Storage section at the bottom, uploads often fail with `row-level security policy`.
2. If the bucket already exists, run only the tail of `schema.sql` from `insert into storage.buckets…` through the policy `create` statements.
3. Copy **Project URL** and **service_role** key (Settings → API). **Do not** expose the service role in the client.

## Environment

```bash
cp .env.example server/.env
cp .env.example client/.env.local
# Edit both files with real values.
```

**`server/.env`** must include at least `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `CLIENT_ORIGIN`, and one LLM key. **`client/.env.local`** needs `NEXT_PUBLIC_API_URL` pointing at the API (e.g. `http://localhost:4000`).

## Run locally

From the repo root:

```bash
npm install
npm run dev
```

This starts **Express** on port **4000** and **Next.js** on **3000**.

Or separately:

```bash
npm run dev -w server
npm run dev -w client
```

Open http://localhost:3000

## Railway (monorepo from repo root)

Nixpacks: `npm run build --workspace=server|client`, но в корне **нет** скрипта `start` → дефолтный `npm start` падает → healthcheck «service unavailable».

**Settings → Deploy → Custom Start Command** для каждого сервиса:

| Сервис | Start Command |
|--------|----------------|
| API | `npm run start:server` |
| Web | `npm run start:client` |

Либо **Root Directory** = `server` или `client`: тогда сработает локальный `npm start`.

## API overview (REST)

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/health` | Liveness |
| `GET` | `/api/health` | DB ping |
| `POST` | `/api/auth/register` | Register + session tokens |
| `POST` | `/api/auth/login` | Login |
| `GET` | `/api/auth/me` | Current user (Bearer) |
| `GET` | `/api/chats` | List chats (cookie + optional Bearer) |
| `POST` | `/api/chats` | Create chat |
| `GET` | `/api/chats/:chatId` | Chat + messages |
| `PATCH` | `/api/chats/:chatId` | Rename (auth only) |
| `DELETE` | `/api/chats/:chatId` | Delete chat |
| `POST` | `/api/chats/:chatId/messages` | Send message; SSE stream by default |
| `GET` | `/api/chats/:chatId/documents` | List documents |
| `POST` | `/api/chats/:chatId/documents` | Multipart `file` upload |
