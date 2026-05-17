-- ══════════════════════════════════════════
-- BLOCO 1 — Tabelas principais
-- Cole no SQL Editor e clique em RUN
-- ══════════════════════════════════════════
 
create table if not exists public.profiles (
  id           uuid references auth.users(id) on delete cascade primary key,
  username     text unique not null,
  display_name text,
  avatar_url   text,
  bio          text,
  plan         text default 'free' check (plan in ('free','pro','studio')),
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);
 
create table if not exists public.platform_connections (
  id            uuid default gen_random_uuid() primary key,
  user_id       uuid references public.profiles(id) on delete cascade not null,
  platform      text not null check (platform in ('youtube','twitch','kick','tiktok','facebook')),
  access_token  text,
  refresh_token text,
  expires_at    timestamptz,
  stream_key    text,
  rtmp_url      text,
  channel_id    text,
  channel_name  text,
  is_active     boolean default true,
  connected_at  timestamptz default now(),
  unique(user_id, platform)
);
 
create table if not exists public.streams (
  id             uuid default gen_random_uuid() primary key,
  user_id        uuid references public.profiles(id) on delete cascade not null,
  title          text not null default 'Minha live',
  description    text,
  thumbnail_url  text,
  status         text default 'offline' check (status in ('offline','live','ended')),
  platforms      text[] default '{}',
  started_at     timestamptz,
  ended_at       timestamptz,
  peak_viewers   int default 0,
  total_messages int default 0,
  created_at     timestamptz default now()
);
 
create table if not exists public.chat_messages (
  id         uuid default gen_random_uuid() primary key,
  stream_id  uuid references public.streams(id) on delete cascade not null,
  platform   text not null,
  username   text not null,
  message    text not null,
  user_color text,
  is_mod     boolean default false,
  created_at timestamptz default now()
);
 
create table if not exists public.stream_alerts (
  id         uuid default gen_random_uuid() primary key,
  stream_id  uuid references public.streams(id) on delete cascade not null,
  type       text not null check (type in ('donation','subscription','follow','raid','bits')),
  platform   text not null,
  username   text,
  amount     numeric,
  currency   text default 'BRL',
  message    text,
  shown      boolean default false,
  created_at timestamptz default now()
);
 
create index if not exists chat_messages_stream_id_idx on public.chat_messages(stream_id, created_at desc);
 
 
-- ══════════════════════════════════════════
-- BLOCO 2 — Trigger: cria perfil automático
-- Cole no SQL Editor e clique em RUN
-- ══════════════════════════════════════════
 
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;
 
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
 
 
-- ══════════════════════════════════════════
-- BLOCO 3 — Row Level Security (RLS)
-- Cole no SQL Editor e clique em RUN
-- ══════════════════════════════════════════
 
alter table public.profiles              enable row level security;
alter table public.platform_connections  enable row level security;
alter table public.streams               enable row level security;
alter table public.chat_messages         enable row level security;
alter table public.stream_alerts         enable row level security;
 
-- profiles
drop policy if exists "Perfis visíveis para todos" on public.profiles;
create policy "Perfis visíveis para todos"
  on public.profiles for select using (true);

drop policy if exists "Streamer edita o próprio perfil" on public.profiles;
create policy "Streamer edita o próprio perfil"
  on public.profiles for update using (auth.uid() = id);
 
-- platform_connections
drop policy if exists "Conexões privadas do streamer" on public.platform_connections;
create policy "Conexões privadas do streamer"
  on public.platform_connections for all using (auth.uid() = user_id);
 
-- streams
drop policy if exists "Lives visíveis para todos" on public.streams;
create policy "Lives visíveis para todos"
  on public.streams for select using (true);

drop policy if exists "Streamer gerencia as próprias lives" on public.streams;
create policy "Streamer gerencia as próprias lives"
  on public.streams for all using (auth.uid() = user_id);
 
-- chat_messages
drop policy if exists "Chat público para leitura" on public.chat_messages;
create policy "Chat público para leitura"
  on public.chat_messages for select using (true);

drop policy if exists "Inserção autenticada no chat" on public.chat_messages;
create policy "Inserção autenticada no chat"
  on public.chat_messages for insert with check (auth.role() = 'authenticated');
 
-- stream_alerts
drop policy if exists "Alertas privados do streamer" on public.stream_alerts;
create policy "Alertas privados do streamer"
  on public.stream_alerts for all using (
    auth.uid() = (select user_id from public.streams where id = stream_id)
  );
 
 
-- ══════════════════════════════════════════
-- BLOCO 4 — Realtime + Storage
-- Cole no SQL Editor e clique em RUN
-- ══════════════════════════════════════════
 
alter publication supabase_realtime add table public.chat_messages;
alter publication supabase_realtime add table public.stream_alerts;
alter publication supabase_realtime add table public.streams;
 
insert into storage.buckets (id, name, public) values ('avatars',    'avatars',    true)  on conflict do nothing;
insert into storage.buckets (id, name, public) values ('thumbnails', 'thumbnails', true)  on conflict do nothing;
insert into storage.buckets (id, name, public) values ('vods',       'vods',       false) on conflict do nothing;
 
drop policy if exists "Avatar upload pelo dono" on storage.objects;
create policy "Avatar upload pelo dono"
  on storage.objects for insert with check (
    bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Avatares públicos" on storage.objects;
create policy "Avatares públicos"
  on storage.objects for select using (bucket_id = 'avatars');

drop policy if exists "Thumbnails públicos" on storage.objects;
create policy "Thumbnails públicos"
  on storage.objects for select using (bucket_id = 'thumbnails');
