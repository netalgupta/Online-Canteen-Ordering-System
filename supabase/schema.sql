-- ============================================================================
-- QueueLess — Supabase schema
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query).
-- Safe to re-run: drops and recreates policies/tables where needed.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- profiles: one row per auth user, holds display name + role
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  name       text not null default 'Student',
  email      text,
  phone      text,
  role       text not null default 'student' check (role in ('student','staff','admin')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- menu_items: the canteen catalog
-- ---------------------------------------------------------------------------
create table if not exists public.menu_items (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  category   text not null,
  price      integer not null,
  prep_time  integer not null default 8,
  veg        boolean not null default true,
  available  boolean not null default true,
  popular    boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- orders: one row per placed order
-- token is a short human-facing pickup number from a sequence
-- ---------------------------------------------------------------------------
create sequence if not exists public.order_token_seq start 248;

create table if not exists public.orders (
  id             uuid primary key default gen_random_uuid(),
  token          integer not null default nextval('public.order_token_seq'),
  user_id        uuid not null references auth.users(id) on delete cascade,
  student_name   text not null default 'Student',
  items          jsonb not null default '[]'::jsonb,
  status         text not null default 'received'
                   check (status in ('received','accepted','preparing','ready','collected','cancelled')),
  subtotal       integer not null default 0,
  prep_time      integer not null default 5,
  pickup_time    text,
  payment_method text,
  history        jsonb not null default '[]'::jsonb,
  created_at     timestamptz not null default now()
);

create index if not exists orders_user_id_idx on public.orders(user_id);
create index if not exists orders_status_idx  on public.orders(status);

-- ---------------------------------------------------------------------------
-- Helper: current user's role (SECURITY DEFINER avoids RLS recursion)
-- ---------------------------------------------------------------------------
create or replace function public.current_role()
returns text
language sql
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- Trigger: create a profile row automatically on signup
-- Pulls name/role from the signup metadata when present.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1), 'Student'),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'student')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table public.profiles   enable row level security;
alter table public.menu_items enable row level security;
alter table public.orders     enable row level security;

-- ----- profiles ------------------------------------------------------------
drop policy if exists "profiles read own"       on public.profiles;
drop policy if exists "profiles read staff"     on public.profiles;
drop policy if exists "profiles update own"     on public.profiles;
drop policy if exists "profiles insert own"     on public.profiles;

create policy "profiles read own" on public.profiles
  for select using (id = auth.uid() or public.current_role() in ('staff','admin'));

create policy "profiles update own" on public.profiles
  for update using (id = auth.uid());

create policy "profiles insert own" on public.profiles
  for insert with check (id = auth.uid());

-- ----- menu_items ----------------------------------------------------------
drop policy if exists "menu read all"    on public.menu_items;
drop policy if exists "menu write staff" on public.menu_items;
drop policy if exists "menu insert admin" on public.menu_items;
drop policy if exists "menu delete admin" on public.menu_items;

-- Anyone signed in can read the menu.
create policy "menu read all" on public.menu_items
  for select using (auth.role() = 'authenticated');

-- Staff and admin can update availability / price / prep time.
create policy "menu write staff" on public.menu_items
  for update using (public.current_role() in ('staff','admin'));

-- Only admin can add / remove items.
create policy "menu insert admin" on public.menu_items
  for insert with check (public.current_role() = 'admin');

create policy "menu delete admin" on public.menu_items
  for delete using (public.current_role() = 'admin');

-- ----- orders --------------------------------------------------------------
drop policy if exists "orders read own or staff"   on public.orders;
drop policy if exists "orders insert own"          on public.orders;
drop policy if exists "orders update own or staff" on public.orders;

-- Students see their own orders; staff/admin see all.
create policy "orders read own or staff" on public.orders
  for select using (user_id = auth.uid() or public.current_role() in ('staff','admin'));

-- Students place their own orders.
create policy "orders insert own" on public.orders
  for insert with check (user_id = auth.uid());

-- Students can update their own (e.g. cancel); staff/admin can advance any.
create policy "orders update own or staff" on public.orders
  for update using (user_id = auth.uid() or public.current_role() in ('staff','admin'));

-- ============================================================================
-- Realtime: let track/kitchen pages get live order updates
-- ============================================================================
alter publication supabase_realtime add table public.orders;

-- ============================================================================
-- Seed: menu items
-- Prices from the canteen board. Prep times are per-category defaults.
-- Re-running clears and reseeds the catalog.
-- ============================================================================
truncate table public.menu_items;

insert into public.menu_items (name, category, price, prep_time, veg, available, popular, sort_order) values
-- HOT ITEMS (prep ~4)
('TEA', 'HOT ITEMS', 16, 4, true, true, true, 10),
('COFFEE', 'HOT ITEMS', 20, 4, true, true, true, 20),
('HOT MILK', 'HOT ITEMS', 28, 4, true, true, false, 30),
('TEA (HALF)', 'HOT ITEMS', 10, 4, true, true, false, 40),
('TEA (STAFF)', 'HOT ITEMS', 9, 4, true, true, false, 50),

-- SNACKS (prep ~8)
('SAMOSA PAV', 'SNACKS', 22, 6, true, true, true, 10),
('VADA PAV', 'SNACKS', 22, 6, true, true, true, 20),
('SAMOSA PLATE', 'SNACKS', 42, 8, true, true, false, 30),
('PAV', 'SNACKS', 6, 3, true, true, false, 40),
('BUTTER PAV', 'SNACKS', 13, 4, true, true, false, 50),
('BATATA WADA', 'SNACKS', 38, 8, true, true, false, 60),
('SAMOSA USAL', 'SNACKS', 59, 9, true, true, false, 70),
('VADA USAL', 'SNACKS', 53, 9, true, true, false, 80),
('VADA USAL (SINGLE)', 'SNACKS', 32, 8, true, true, false, 90),
('SAMOSA USAL (SINGLE)', 'SNACKS', 32, 8, true, true, false, 100),
('VADA SAMOSA USAL', 'SNACKS', 59, 9, true, true, false, 110),
('DHAI SOMASA', 'SNACKS', 53, 8, true, true, false, 120),
('USAL PAV', 'SNACKS', 40, 8, true, true, false, 130),
('MISAL PAV', 'SNACKS', 55, 9, true, true, true, 140),
('BREAD PAKODA', 'SNACKS', 44, 8, true, true, false, 150),
('IDLI SAMBAR', 'SNACKS', 44, 9, true, true, false, 160),
('MEDU VADA SAMBAR', 'SNACKS', 53, 9, true, true, false, 170),
('IDLI WADA', 'SNACKS', 53, 9, true, true, false, 180),
('DAHI IDLI', 'SNACKS', 58, 9, true, true, false, 190),
('BUTTER IDLI', 'SNACKS', 58, 9, true, true, false, 200),
('IDLI FRY', 'SNACKS', 55, 9, true, true, false, 210),
('DAHI MISAL PAV', 'SNACKS', 74, 10, true, true, false, 220),
('UPMA / POHA', 'SNACKS', 37, 8, true, true, false, 230),

-- FAST ITEMS (prep ~10)
('POTATO CHIPS WITH LASSI', 'FAST ITEMS', 58, 8, true, true, false, 10),
('POTATO TOST WITH LASSI', 'FAST ITEMS', 58, 8, true, true, false, 20),
('SABHUDANA VADA / KHICHDI', 'FAST ITEMS', 58, 10, true, true, false, 30),
('ALU JIRA', 'FAST ITEMS', 58, 10, true, true, false, 40),

-- DOSA ITEMS (prep ~10)
('SADA DOSA', 'DOSA ITEMS', 47, 9, true, true, true, 10),
('BUTTER SADA DOSA', 'DOSA ITEMS', 68, 10, true, true, false, 20),
('CHEESE SADA DOSA', 'DOSA ITEMS', 84, 11, true, true, false, 30),
('MASALA DOSA', 'DOSA ITEMS', 68, 11, true, true, true, 40),
('CHEESE MASALA DOSA', 'DOSA ITEMS', 89, 12, true, true, false, 50),
('MYSORE SADA DOSA', 'DOSA ITEMS', 65, 10, true, true, false, 60),
('MYSORE MASALA DOSA', 'DOSA ITEMS', 84, 12, true, true, false, 70),
('CHEESE MYSORE SADA', 'DOSA ITEMS', 89, 12, true, true, false, 80),
('CHEESE MYSORE MASALA', 'DOSA ITEMS', 105, 13, true, true, false, 90),
('CHINESE SADA DOSA', 'DOSA ITEMS', 58, 11, true, true, false, 100),
('CHINESE DOSA (NOODLES)', 'DOSA ITEMS', 89, 13, true, true, false, 110),
('CHEESE CHINES DOSA', 'DOSA ITEMS', 116, 13, true, true, false, 120),

-- SPECIAL UTTAPPA (prep ~10)
('SADA UTTAPPA', 'SPECIAL UTTAPPA', 58, 10, true, true, false, 10),
('BUTTER SADA UTTAPPA', 'SPECIAL UTTAPPA', 74, 11, true, true, false, 20),
('CHEESE UTTAPPA', 'SPECIAL UTTAPPA', 95, 12, true, true, false, 30),
('ONION UTTAPPA', 'SPECIAL UTTAPPA', 63, 11, true, true, false, 40),
('CHEESE ONION UTTAPPA', 'SPECIAL UTTAPPA', 95, 12, true, true, false, 50),
('MASALA UTTAPPA', 'SPECIAL UTTAPPA', 63, 11, true, true, false, 60),
('CHEESE MASALA UTTAPPA', 'SPECIAL UTTAPPA', 100, 12, true, true, false, 70),
('TOMATO UTTAPPA', 'SPECIAL UTTAPPA', 63, 11, true, true, false, 80),
('CHEESE TOMATO UTTAPPA', 'SPECIAL UTTAPPA', 95, 12, true, true, false, 90),
('FOUR TEST UTTAPPA', 'SPECIAL UTTAPPA', 79, 12, true, true, false, 100),
('TOMATO OMLATE', 'SPECIAL UTTAPPA', 68, 11, true, true, false, 110),

-- SANDWICHES (prep ~7)
('BREAD BUTTER', 'SANDWICHES', 32, 5, true, true, false, 10),
('TOAST BREAD BUTTER', 'SANDWICHES', 46, 6, true, true, false, 20),
('VEG. SANDWICH', 'SANDWICHES', 42, 7, true, true, true, 30),
('VEG. CHEESE SANDWICH', 'SANDWICHES', 95, 8, true, true, false, 40),
('VEG. CHEESE TOAST SANDWICH', 'SANDWICHES', 105, 8, true, true, false, 50),
('CHEESE SANDWICH (ONLY)', 'SANDWICHES', 84, 7, true, true, false, 60),
('TOMATO SANDWICH', 'SANDWICHES', 42, 7, true, true, false, 70),
('CHEES CLUB SANDWICH', 'SANDWICHES', 116, 9, true, true, false, 80),
('VEG. TOAST SANDWICH', 'SANDWICHES', 68, 8, true, true, false, 90),
('ONLY CHEESE TOAST SANDWICH', 'SANDWICHES', 105, 8, true, true, false, 100),
('CHINESE TOAST SANDWICH', 'SANDWICHES', 76, 8, true, true, false, 110),
('CLUB SANDWICH', 'SANDWICHES', 86, 9, true, true, false, 120),
('CHEESE CHINESE TOAST SANDWICH', 'SANDWICHES', 116, 9, true, true, false, 130),

-- GRILLED SANDWICH (prep ~9)
('GRILLED SANDWICH', 'GRILLED SANDWICH', 89, 9, true, true, true, 10),
('VEG. CHEESE GRILLED SANDWICH', 'GRILLED SANDWICH', 116, 10, true, true, false, 20),
('CHINESE GRILL SANDWICH', 'GRILLED SANDWICH', 89, 10, true, true, false, 30),
('VEG. CHINEESE CHEESE GRILL SANDWICH', 'GRILLED SANDWICH', 116, 11, true, true, false, 40),

-- CHAT ITEMS (prep ~6)
('BHEL PURI', 'CHAT ITEMS', 42, 6, true, true, true, 10),
('SEV PURI', 'CHAT ITEMS', 42, 6, true, true, false, 20),
('DAHI POTATO PURI', 'CHAT ITEMS', 68, 7, true, true, false, 30),
('BOMBAY PURI', 'CHAT ITEMS', 74, 7, true, true, false, 40),
('SUKHA BHEL', 'CHAT ITEMS', 42, 6, true, true, false, 50),
('CHEESE BHEL', 'CHAT ITEMS', 89, 7, true, true, false, 60),

-- NOODLES (prep ~12)
('HAKKA NOODLES', 'NOODLES', 97, 12, true, true, true, 10),
('SCHEZWAN NOODLES', 'NOODLES', 105, 12, true, true, false, 20),
('SINGAPORE NOODLES', 'NOODLES', 105, 12, true, true, false, 30),
('MANCHOW NOODLES', 'NOODLES', 105, 12, true, true, false, 40),
('MANCHURIAN NOODLES', 'NOODLES', 105, 13, true, true, false, 50),
('TRIPLE SCHEZWAN NOODLES', 'NOODLES', 110, 13, true, true, false, 60),
('CHINESE BHEL', 'NOODLES', 89, 10, true, true, false, 70),
('CHINEESE CHEESE BHEL', 'NOODLES', 126, 11, true, true, false, 80),

-- RICE ITEMS (prep ~12)
('FRIED RICE', 'RICE ITEMS', 100, 12, true, true, true, 10),
('SCHEZWAN RICE', 'RICE ITEMS', 105, 12, true, true, false, 20),
('SINGAPORE RICE', 'RICE ITEMS', 105, 12, true, true, false, 30),
('MANCHOW RICE', 'RICE ITEMS', 105, 12, true, true, false, 40),
('MANCHURIAN RICE', 'RICE ITEMS', 110, 13, true, true, false, 50),
('TRIPLE SCHEZWAN RICE', 'RICE ITEMS', 110, 13, true, true, false, 60),

-- SPECIAL RICE (prep ~12)
('TOMATO RICE (WITH DAHI)', 'SPECIAL RICE', 89, 11, true, true, false, 10),
('LEMON RICE', 'SPECIAL RICE', 74, 10, true, true, false, 20),
('PANEER CHILLY RICE', 'SPECIAL RICE', 131, 13, true, true, false, 30),
('VEG. BIRYANI RICE', 'SPECIAL RICE', 105, 13, true, true, false, 40),
('PANEER BIRYANI RICE', 'SPECIAL RICE', 131, 14, true, true, false, 50),

-- GRAVY ITEMS (prep ~12)
('VEG. MANCHURIAN', 'GRAVY ITEMS', 74, 12, true, true, false, 10),
('VEG. CHILLY', 'GRAVY ITEMS', 74, 12, true, true, false, 20),
('VEG. GARLIC', 'GRAVY ITEMS', 74, 12, true, true, false, 30),
('PANEER CHILLY', 'GRAVY ITEMS', 121, 13, true, true, false, 40),
('IDLI CHILLY', 'GRAVY ITEMS', 74, 11, true, true, false, 50),
('IDLI MANCHURIAN', 'GRAVY ITEMS', 74, 11, true, true, false, 60),

-- CHOUPSEY (prep ~12)
('AMERICAN CHOUPSEY', 'CHOUPSEY', 86, 12, true, true, false, 10),
('SCHEZWAN CHOUPSEY', 'CHOUPSEY', 86, 12, true, true, false, 20),
('CHINESE CHOUPSEY', 'CHOUPSEY', 86, 12, true, true, false, 30),

-- SOUP & EXTRAS (prep ~6)
('MANCHOW SOUP', 'SOUP & EXTRAS', 79, 8, true, true, false, 10),
('TOMATO SOUP', 'SOUP & EXTRAS', 79, 8, true, true, false, 20),
('VEG. CLEAR SOUP', 'SOUP & EXTRAS', 79, 8, true, true, false, 30),
('EXTRA BUTTER', 'SOUP & EXTRAS', 42, 2, true, true, false, 40),
('VATI DAL', 'SOUP & EXTRAS', 37, 3, true, true, false, 50),
('VATI SAMBHAR', 'SOUP & EXTRAS', 25, 3, true, true, false, 60),
('VATI CHATNI', 'SOUP & EXTRAS', 19, 2, true, true, false, 70),
('VATI SAUCE', 'SOUP & EXTRAS', 14, 2, true, true, false, 80),

-- LUNCH ITEMS (prep ~12)
('CHAPPATI BHAJI', 'LUNCH ITEMS', 68, 10, true, true, false, 10),
('CHAPPATI PANEER BHAJI', 'LUNCH ITEMS', 86, 12, true, true, false, 20),
('PURI SADA BHAJI', 'LUNCH ITEMS', 68, 10, true, true, false, 30),
('PURI PANEER BHAJI', 'LUNCH ITEMS', 89, 12, true, true, false, 40),
('POTATO BHAJI', 'LUNCH ITEMS', 53, 9, true, true, false, 50),
('PANEER BHAJI (FULL)', 'LUNCH ITEMS', 89, 12, true, true, false, 60),
('SADA BHAJI (FULL)', 'LUNCH ITEMS', 63, 10, true, true, false, 70),
('PANEER BHAJI (HALF)', 'LUNCH ITEMS', 44, 9, true, true, false, 80),
('SADA BHAJI (HALF)', 'LUNCH ITEMS', 44, 9, true, true, false, 90),
('VEG. RAITA', 'LUNCH ITEMS', 37, 5, true, true, false, 100),
('DAHI (CURD)', 'LUNCH ITEMS', 32, 3, true, true, false, 110),
('PURI PLATE', 'LUNCH ITEMS', 26, 6, true, true, false, 120),
('SINGLE CHAPATI', 'LUNCH ITEMS', 8, 4, true, true, false, 130),
('DAL FRY', 'LUNCH ITEMS', 42, 10, true, true, false, 140),
('LUNCH', 'LUNCH ITEMS', 84, 12, true, true, true, 150),
('LUNCH WITH PULAV', 'LUNCH ITEMS', 97, 13, true, true, false, 160),
('LUNCH WITH JEERA RICE', 'LUNCH ITEMS', 97, 13, true, true, false, 170),
('DAL RICE', 'LUNCH ITEMS', 53, 10, true, true, false, 180),
('DAL FRY RICE', 'LUNCH ITEMS', 79, 12, true, true, false, 190),
('DAL RICE WITH BHAJI', 'LUNCH ITEMS', 76, 12, true, true, false, 200),
('PLAIN DAHI RICE', 'LUNCH ITEMS', 76, 10, true, true, false, 210),
('DAHI MASALA RICE', 'LUNCH ITEMS', 89, 12, true, true, false, 220),
('JEERA RICE WITH SAMBAR', 'LUNCH ITEMS', 74, 11, true, true, false, 230),
('JEERA RICE WITH SADA BHAJI', 'LUNCH ITEMS', 84, 12, true, true, false, 240),
('JEERA RICE WITH PANEER BHAJI', 'LUNCH ITEMS', 100, 13, true, true, false, 250),
('JEERA RICE WITH DAL FRY', 'LUNCH ITEMS', 89, 12, true, true, false, 260),
('JEERA RICE WITH RAITA', 'LUNCH ITEMS', 100, 12, true, true, false, 270),
('PULAV RICE WITH SAMBAR', 'LUNCH ITEMS', 86, 12, true, true, false, 280),
('PULAV RICE WITH SADA BHAJI', 'LUNCH ITEMS', 91, 12, true, true, false, 290),
('PULAV RICE WITH PANEER BHAJI', 'LUNCH ITEMS', 100, 13, true, true, false, 300),
('PULAV RICE WITH DAL FRY', 'LUNCH ITEMS', 86, 12, true, true, false, 310),
('MASALA RICE WITH SAMBAR', 'LUNCH ITEMS', 86, 12, true, true, false, 320),
('MASALA RICE WITH RAITA', 'LUNCH ITEMS', 97, 12, true, true, false, 330),
('MASALA RICE WITH SADA BHAJI', 'LUNCH ITEMS', 97, 12, true, true, false, 340),
('MASALA RICE WITH PANEER BHAJI', 'LUNCH ITEMS', 105, 13, true, true, false, 350);
