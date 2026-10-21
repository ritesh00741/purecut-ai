-- ==============================================================================
-- PureCut AI - Production Supabase PostgreSQL Schema & Security Policies (RLS)
-- ==============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES TABLE (Associated with auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  avatar_url text,
  plan text default 'free' check (plan in ('free', 'pro', 'enterprise')),
  credits integer default 10,
  max_credits integer default 10,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for profiles
alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- 2. PROCESSED IMAGES TABLE
create table if not exists public.processed_images (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  original_url text,
  result_url text not null,
  width integer,
  height integer,
  size_bytes bigint,
  background_type text default 'transparent',
  background_color text,
  background_image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for fast querying
create index if not exists idx_processed_images_user_id on public.processed_images(user_id);
create index if not exists idx_processed_images_created_at on public.processed_images(created_at desc);

-- Enable RLS for processed_images
alter table public.processed_images enable row level security;

create policy "Users can view their own images"
  on public.processed_images for select
  using (auth.uid() = user_id);

create policy "Users can insert their own images"
  on public.processed_images for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own images"
  on public.processed_images for delete
  using (auth.uid() = user_id);

-- 3. API KEYS TABLE
create table if not exists public.api_keys (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  key_prefix text not null,
  key_hash text not null,
  requests_count integer default 0,
  last_used_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_api_keys_user_id on public.api_keys(user_id);

-- Enable RLS for api_keys
alter table public.api_keys enable row level security;

create policy "Users can manage their own API keys"
  on public.api_keys for all
  using (auth.uid() = user_id);

-- 4. AUTOMATIC PROFILE CREATION TRIGGER
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url, plan, credits, max_credits)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'PureCut User'),
    coalesce(new.raw_user_meta_data->>'avatar_url', ''),
    'free',
    10,
    10
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger whenever a new user signs up via Supabase Auth
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
