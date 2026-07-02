create extension if not exists pgcrypto;

create table if not exists public.blocked_dates (
  id uuid primary key default gen_random_uuid(),
  start_date date not null,
  end_date date not null,
  note text,
  created_at timestamptz not null default now(),
  constraint blocked_dates_valid_range check (start_date <= end_date)
);

create index if not exists blocked_dates_range_idx
  on public.blocked_dates (start_date, end_date);

create table if not exists public.booking_requests (
  id uuid primary key default gen_random_uuid(),
  arrival_date date not null,
  departure_date date not null,
  name text not null,
  phone text not null,
  email text not null,
  guests integer not null,
  message text,
  status text not null default 'new',
  source text not null default 'website',
  user_agent text,
  created_at timestamptz not null default now(),
  constraint booking_requests_valid_range check (arrival_date <= departure_date),
  constraint booking_requests_valid_guests check (guests between 1 and 10)
);

alter table public.blocked_dates enable row level security;
alter table public.booking_requests enable row level security;
