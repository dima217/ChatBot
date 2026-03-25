create table if not exists public.anonymous_usage (
  session_id text primary key,
  user_messages_used integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.chats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  anonymous_session_id text,
  title text not null default 'New chat',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chats_owner_chk check (
    (user_id is not null and anonymous_session_id is null)
    or (user_id is null and anonymous_session_id is not null)
  )
);

create index if not exists chats_user_updated_idx on public.chats (user_id, updated_at desc);
create index if not exists chats_anon_updated_idx on public.chats (anonymous_session_id, updated_at desc);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats (id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null default '',
  image_urls jsonb not null default '[]'::jsonb,
  provider text,
  created_at timestamptz not null default now()
);

create index if not exists messages_chat_created_idx on public.messages (chat_id, created_at);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  filename text not null,
  mime_type text not null,
  storage_path text not null,
  extracted_text text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists documents_chat_idx on public.documents (chat_id);

-- Storage: bucket + RLS (otherwise uploads return 403 row-level security)
insert into storage.buckets (id, name, public)
values ('chat-uploads', 'chat-uploads', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "chat-uploads insert" on storage.objects;
drop policy if exists "chat-uploads select" on storage.objects;
drop policy if exists "chat-uploads update" on storage.objects;
drop policy if exists "chat-uploads delete" on storage.objects;

create policy "chat-uploads insert"
on storage.objects for insert
with check (bucket_id = 'chat-uploads');

create policy "chat-uploads select"
on storage.objects for select
using (bucket_id = 'chat-uploads');

create policy "chat-uploads update"
on storage.objects for update
using (bucket_id = 'chat-uploads')
with check (bucket_id = 'chat-uploads');

create policy "chat-uploads delete"
on storage.objects for delete
using (bucket_id = 'chat-uploads');
