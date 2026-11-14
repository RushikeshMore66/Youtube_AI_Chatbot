-- YouTube AI-Genie v1 schema. RLS is enabled on every table.
-- Writes to videos/outputs/usage/chats and plan changes happen server-side with the service role.

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  razorpay_subscription_id text,
  created_at timestamptz not null default now()
);

create table public.videos (
  video_id text primary key,
  title text not null,
  duration_seconds integer not null default 0,
  transcript text not null,
  language text,
  created_at timestamptz not null default now()
);

create table public.outputs (
  id uuid primary key default gen_random_uuid(),
  video_id text not null references public.videos(video_id) on delete cascade,
  type text not null check (type in ('summary', 'notes', 'post')),
  content text not null,
  created_at timestamptz not null default now(),
  unique (video_id, type)
);

create table public.usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  video_id text not null references public.videos(video_id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, video_id)
);
create index usage_user_created_idx on public.usage (user_id, created_at desc);

create table public.chats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  video_id text not null references public.videos(video_id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);
create index chats_user_video_idx on public.chats (user_id, video_id, created_at);

alter table public.profiles enable row level security;
alter table public.videos enable row level security;
alter table public.outputs enable row level security;
alter table public.usage enable row level security;
alter table public.chats enable row level security;

-- Users can read their own profile. No client-side writes: plan changes only via service role.
create policy "profiles: read own" on public.profiles
  for select to authenticated using (id = auth.uid());

-- Users can read videos/outputs they have processed (tracked in usage).
create policy "videos: read if used" on public.videos
  for select to authenticated
  using (exists (select 1 from public.usage u where u.video_id = videos.video_id and u.user_id = auth.uid()));

create policy "outputs: read if used" on public.outputs
  for select to authenticated
  using (exists (select 1 from public.usage u where u.video_id = outputs.video_id and u.user_id = auth.uid()));

create policy "usage: read own" on public.usage
  for select to authenticated using (user_id = auth.uid());

create policy "chats: read own" on public.chats
  for select to authenticated using (user_id = auth.uid());

-- Create a profile row on signup.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
