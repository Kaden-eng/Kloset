-- =========================================
-- Kloset Profiles Table Migration
-- =========================================
-- Run this SQL in your Supabase SQL Editor to create the profiles table
-- and connect it to Supabase Auth
-- =========================================

-- Enable Row Level Security globally
alter table if exists profiles enable row level security;

-- Create profiles table
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create trigger to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at_column();

-- Row Level Security Policies for profiles table
create policy "Users can view own profile" on profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on profiles
  for update using (auth.uid() = id);

create policy "Users can insert own profile" on profiles
  for insert with check (auth.uid() = id);

-- Grant necessary permissions
grant usage on schema public to anon, authenticated;
grant all on profiles to anon, authenticated;

-- =========================================
-- Migration completed successfully!
-- =========================================