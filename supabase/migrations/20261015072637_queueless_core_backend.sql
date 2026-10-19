-- QueueLess production foundation. Additive migration: does not drop or rewrite existing SkipQ objects.
create extension if not exists pgcrypto;

create table if not exists public.ql_counters (
  id text primary key check (id in ('C1','C2','C3','C4')),
  name text not null,
  short_name text not null
);
insert into public.ql_counters(id,name,short_name) values
 ('C1','Packaged Snacks & Ice Cream','Snacks & Ice Cream'),
 ('C2','Frankie & Juice','Frankie & Juice'),
 ('C3','Chaat Counter','Chaat Counter'),
 ('C4','Main Canteen · Meals & Everything Else','Main Canteen')
on conflict (id) do update set name=excluded.name, short_name=excluded.short_name;

create table if not exists public.ql_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default 'Student',
  phone text,
  roll_number text,
  role text not null default 'student' check (role in ('student','staff','admin')),
  counter_id text references public.ql_counters(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ql_staff_counter_required check (role <> 'staff' or counter_id is not null)
);

create table if not exists public.ql_menu_items (
  id text primary key,
  name text not null,
  category text not null,
  price integer not null check (price >= 0),
  prep_time_minutes integer not null default 5 check (prep_time_minutes between 1 and 180),
  veg boolean not null default true,
  available boolean not null default true,
  popular boolean not null default false,
  description text,
  image_url text,
  counter_id text not null references public.ql_counters(id),
  updated_at timestamptz not null default now()
);
create index if not exists ql_menu_category_available_idx on public.ql_menu_items(category, available);

create sequence if not exists public.ql_order_number_seq start 1001;
create table if not exists public.ql_orders (
  id uuid primary key default gen_random_uuid(),
  order_number bigint not null default nextval('public.ql_order_number_seq'),
  user_id uuid not null references auth.users(id),
  pickup_slot timestamptz not null,
  payment_method text not null default 'pay-at-counter',
  status text not null default 'received' check (status in ('received','accepted','preparing','ready','collected','cancelled')),
  total integer not null default 0 check (total >= 0),
  customer_name text not null default 'Student',
  instructions text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(order_number)
);
create index if not exists ql_orders_user_created_idx on public.ql_orders(user_id, created_at desc);
create index if not exists ql_orders_pickup_status_idx on public.ql_orders(pickup_slot, status);

create table if not exists public.ql_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.ql_orders(id) on delete cascade,
  menu_item_id text not null references public.ql_menu_items(id),
  item_name text not null,
  quantity integer not null check (quantity between 1 and 99),
  unit_price integer not null check (unit_price >= 0),
  counter_id text not null references public.ql_counters(id),
  status text not null default 'received' check (status in ('received','accepted','preparing','ready','collected')),
  instructions text,
  prep_time_minutes integer not null default 5,
  estimated_ready_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ql_order_items_order_idx on public.ql_order_items(order_id);
create index if not exists ql_order_items_counter_status_idx on public.ql_order_items(counter_id,status,created_at);

create table if not exists public.ql_order_item_events (
  id bigint generated always as identity primary key,
  order_item_id uuid not null references public.ql_order_items(id) on delete cascade,
  old_status text,
  new_status text not null,
  changed_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index if not exists ql_order_item_events_item_idx on public.ql_order_item_events(order_item_id,created_at);

create table if not exists public.ql_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  order_id uuid references public.ql_orders(id) on delete cascade,
  order_item_id uuid references public.ql_order_items(id) on delete cascade,
  title text not null,
  message text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists ql_notifications_user_idx on public.ql_notifications(user_id,created_at desc);

create or replace function public.ql_set_updated_at()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists ql_profiles_updated_at on public.ql_profiles;
create trigger ql_profiles_updated_at before update on public.ql_profiles for each row execute function public.ql_set_updated_at();
drop trigger if exists ql_menu_items_updated_at on public.ql_menu_items;
create trigger ql_menu_items_updated_at before update on public.ql_menu_items for each row execute function public.ql_set_updated_at();
drop trigger if exists ql_orders_updated_at on public.ql_orders;
create trigger ql_orders_updated_at before update on public.ql_orders for each row execute function public.ql_set_updated_at();
drop trigger if exists ql_order_items_updated_at on public.ql_order_items;
create trigger ql_order_items_updated_at before update on public.ql_order_items for each row execute function public.ql_set_updated_at();

create or replace function public.ql_handle_new_user()
returns trigger language plpgsql security definer set search_path = public, auth, pg_temp as $$
begin
  insert into public.ql_profiles(user_id,full_name,role)
  values (new.id, coalesce(nullif(new.raw_user_meta_data->>'full_name',''),'Student'), 'student')
  on conflict (user_id) do nothing;
  return new;
end; $$;
drop trigger if exists ql_on_auth_user_created on auth.users;
create trigger ql_on_auth_user_created after insert on auth.users for each row execute function public.ql_handle_new_user();

create or replace function public.ql_my_role()
returns text language sql stable security definer set search_path = public, pg_temp as $$
  select role from public.ql_profiles where user_id = auth.uid()
$$;
create or replace function public.ql_my_counter()
returns text language sql stable security definer set search_path = public, pg_temp as $$
  select counter_id from public.ql_profiles where user_id = auth.uid() and role='staff'
$$;
create or replace function public.ql_user_owns_order(p_order_id uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists(select 1 from public.ql_orders where id=p_order_id and user_id=auth.uid())
$$;
create or replace function public.ql_staff_can_view_order(p_order_id uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists(select 1 from public.ql_order_items where order_id=p_order_id and counter_id=public.ql_my_counter())
$$;

alter table public.ql_counters enable row level security;
alter table public.ql_profiles enable row level security;
alter table public.ql_menu_items enable row level security;
alter table public.ql_orders enable row level security;
alter table public.ql_order_items enable row level security;
alter table public.ql_order_item_events enable row level security;
alter table public.ql_notifications enable row level security;

-- Explicit API grants; RLS policies remain the row-level authorization boundary.
grant select on public.ql_counters to anon, authenticated;
grant select on public.ql_menu_items to anon, authenticated;
grant insert, update, delete on public.ql_menu_items to authenticated;
grant select, update on public.ql_profiles to authenticated;
grant select on public.ql_orders, public.ql_order_items, public.ql_order_item_events to authenticated;
grant select, update on public.ql_notifications to authenticated;
grant usage, select on sequence public.ql_order_number_seq to authenticated;


drop policy if exists ql_counters_read on public.ql_counters;
create policy ql_counters_read on public.ql_counters for select to anon, authenticated using (true);
drop policy if exists ql_profiles_read_self_or_admin on public.ql_profiles;
create policy ql_profiles_read_self_or_admin on public.ql_profiles for select to authenticated using (user_id=auth.uid() or public.ql_my_role()='admin');
drop policy if exists ql_profiles_update_self on public.ql_profiles;
create policy ql_profiles_update_self on public.ql_profiles for update to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid() and role=public.ql_my_role() and counter_id is not distinct from public.ql_my_counter());
drop policy if exists ql_profiles_admin_all on public.ql_profiles;
create policy ql_profiles_admin_all on public.ql_profiles for all to authenticated using (public.ql_my_role()='admin') with check (public.ql_my_role()='admin');
drop policy if exists ql_menu_read on public.ql_menu_items;
create policy ql_menu_read on public.ql_menu_items for select to anon, authenticated using (available=true);
drop policy if exists ql_menu_staff_read on public.ql_menu_items;
create policy ql_menu_staff_read on public.ql_menu_items for select to authenticated using (public.ql_my_role() in ('staff','admin'));
drop policy if exists ql_menu_admin_manage on public.ql_menu_items;
create policy ql_menu_admin_manage on public.ql_menu_items for all to authenticated using (public.ql_my_role()='admin') with check (public.ql_my_role()='admin');
drop policy if exists ql_orders_read_owner_staff_admin on public.ql_orders;
create policy ql_orders_read_owner_staff_admin on public.ql_orders for select to authenticated using (user_id=auth.uid() or public.ql_my_role()='admin' or (public.ql_my_role()='staff' and public.ql_staff_can_view_order(id)));
drop policy if exists ql_order_items_read_owner_counter_admin on public.ql_order_items;
create policy ql_order_items_read_owner_counter_admin on public.ql_order_items for select to authenticated using (public.ql_user_owns_order(order_id) or public.ql_my_role()='admin' or (public.ql_my_role()='staff' and counter_id=public.ql_my_counter()));
drop policy if exists ql_order_events_read_owner_counter_admin on public.ql_order_item_events;
create policy ql_order_events_read_owner_counter_admin on public.ql_order_item_events for select to authenticated using (exists(select 1 from public.ql_order_items oi where oi.id=order_item_id and (public.ql_user_owns_order(oi.order_id) or public.ql_my_role()='admin' or (public.ql_my_role()='staff' and oi.counter_id=public.ql_my_counter()))));
drop policy if exists ql_notifications_owner_read on public.ql_notifications;
create policy ql_notifications_owner_read on public.ql_notifications for select to authenticated using (user_id=auth.uid() or public.ql_my_role()='admin');
drop policy if exists ql_notifications_owner_update on public.ql_notifications;
create policy ql_notifications_owner_update on public.ql_notifications for update to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());

-- Transactional order creation: serializes bookings for the exact slot, then validates capacity and prices server-side.
create or replace function public.ql_create_order(p_items jsonb, p_pickup_slot timestamptz, p_payment_method text default 'pay-at-counter', p_instructions text default null)
returns jsonb language plpgsql security definer set search_path = public, auth, pg_temp as $$
declare
  v_user uuid := auth.uid(); v_profile public.ql_profiles%rowtype; v_order public.ql_orders%rowtype;
  v_item jsonb; v_menu public.ql_menu_items%rowtype; v_qty integer; v_total integer := 0; v_count integer;
  v_local timestamp; v_minutes integer;
begin
  if v_user is null then raise exception 'AUTH_REQUIRED' using errcode='28000'; end if;
  select * into v_profile from public.ql_profiles where user_id=v_user;
  if not found then raise exception 'PROFILE_REQUIRED'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items)=0 then raise exception 'EMPTY_ORDER'; end if;
  if jsonb_array_length(p_items)>30 then raise exception 'TOO_MANY_LINES'; end if;
  v_local := p_pickup_slot at time zone 'Asia/Kolkata';
  v_minutes := extract(hour from v_local)::integer*60 + extract(minute from v_local)::integer;
  if v_minutes < 360 or v_minutes >= 1140 then raise exception 'OUTSIDE_BUSINESS_HOURS'; end if;
  if mod(v_minutes-360,7) <> 0 or extract(second from v_local) <> 0 then raise exception 'INVALID_PICKUP_SLOT'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_pickup_slot::text, 0));
  select count(*) into v_count from public.ql_orders where pickup_slot=p_pickup_slot and status <> 'cancelled';
  if v_count >= 10 then raise exception 'PICKUP_SLOT_FULL' using errcode='P0001'; end if;
  for v_item in select value from jsonb_array_elements(p_items) loop
    v_qty := (v_item->>'quantity')::integer;
    if v_qty < 1 or v_qty > 99 then raise exception 'INVALID_QUANTITY'; end if;
    select * into v_menu from public.ql_menu_items where id=v_item->>'menuItemId' and available=true;
    if not found then raise exception 'MENU_ITEM_UNAVAILABLE: %', v_item->>'menuItemId'; end if;
    v_total := v_total + v_menu.price*v_qty;
  end loop;
  insert into public.ql_orders(user_id,pickup_slot,payment_method,total,customer_name,instructions)
  values(v_user,p_pickup_slot,coalesce(nullif(p_payment_method,''),'pay-at-counter'),v_total,v_profile.full_name,p_instructions)
  returning * into v_order;
  for v_item in select value from jsonb_array_elements(p_items) loop
    v_qty := (v_item->>'quantity')::integer;
    select * into v_menu from public.ql_menu_items where id=v_item->>'menuItemId' and available=true;
    insert into public.ql_order_items(order_id,menu_item_id,item_name,quantity,unit_price,counter_id,status,instructions,prep_time_minutes,estimated_ready_at)
    values(v_order.id,v_menu.id,v_menu.name,v_qty,v_menu.price,
      case when v_menu.category in ('Packaged Snacks','Desserts') then 'C1'
           when v_menu.category in ('Frankie Counter','Juices') then 'C2'
           when v_menu.category='Chaat Items' then 'C3' else 'C4' end,
      'received',nullif(v_item->>'instructions',''),v_menu.prep_time_minutes,
      greatest((date_trunc('day',p_pickup_slot at time zone 'Asia/Kolkata') + time '06:00') at time zone 'Asia/Kolkata', p_pickup_slot - make_interval(mins=>v_menu.prep_time_minutes)));
  end loop;
  insert into public.ql_order_item_events(order_item_id,old_status,new_status,changed_by)
    select id,null,'received',v_user from public.ql_order_items where order_id=v_order.id;
  return jsonb_build_object('id',v_order.id,'orderNumber',v_order.order_number,'status',v_order.status,'total',v_order.total,'pickupSlot',v_order.pickup_slot);
end; $$;

create or replace function public.ql_update_item_status(p_order_item_id uuid, p_new_status text)
returns jsonb language plpgsql security definer set search_path = public, auth, pg_temp as $$
declare v_item public.ql_order_items%rowtype; v_old text; v_owner uuid; v_role text;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED' using errcode='28000'; end if;
  if p_new_status not in ('accepted','preparing','ready','collected') then raise exception 'INVALID_STATUS'; end if;
  v_role := public.ql_my_role();
  select oi into v_item from public.ql_order_items oi where oi.id=p_order_item_id;
  select user_id into v_owner from public.ql_orders where id=v_item.order_id;
  if not found then raise exception 'ITEM_NOT_FOUND'; end if;
  if v_role <> 'admin' and not (v_role='staff' and v_item.counter_id=public.ql_my_counter()) then raise exception 'FORBIDDEN' using errcode='42501'; end if;
  v_old := v_item.status;
  if (v_old='received' and p_new_status not in ('accepted')) or (v_old='accepted' and p_new_status not in ('preparing')) or (v_old='preparing' and p_new_status not in ('ready')) or (v_old='ready' and p_new_status not in ('collected')) then
    raise exception 'INVALID_STATUS_TRANSITION: % -> %',v_old,p_new_status;
  end if;
  update public.ql_order_items set status=p_new_status where id=p_order_item_id returning * into v_item;
  insert into public.ql_order_item_events(order_item_id,old_status,new_status,changed_by) values(v_item.id,v_old,p_new_status,auth.uid());
  if p_new_status='ready' then
    insert into public.ql_notifications(user_id,order_id,order_item_id,title,message)
    values(v_owner,v_item.order_id,v_item.id,'Ready for pickup',v_item.item_name||' is ready for pickup.');
  end if;
  update public.ql_orders o set status=case
    when not exists(select 1 from public.ql_order_items x where x.order_id=o.id and x.status <> 'collected') then 'collected'
    when exists(select 1 from public.ql_order_items x where x.order_id=o.id and x.status='ready') then 'ready'
    when exists(select 1 from public.ql_order_items x where x.order_id=o.id and x.status='preparing') then 'preparing'
    when exists(select 1 from public.ql_order_items x where x.order_id=o.id and x.status='accepted') then 'accepted'
    else 'received' end where o.id=v_item.order_id;
  return jsonb_build_object('itemId',v_item.id,'status',v_item.status,'orderId',v_item.order_id);
end; $$;

revoke all on function public.ql_create_order(jsonb,timestamptz,text,text) from public, anon;
grant execute on function public.ql_create_order(jsonb,timestamptz,text,text) to authenticated;
revoke all on function public.ql_update_item_status(uuid,text) from public, anon;
grant execute on function public.ql_update_item_status(uuid,text) to authenticated;
revoke all on function public.ql_my_role() from public, anon;
grant execute on function public.ql_my_role() to authenticated;
revoke all on function public.ql_my_counter() from public, anon;
grant execute on function public.ql_my_counter() to authenticated;
revoke all on function public.ql_user_owns_order(uuid) from public, anon;
grant execute on function public.ql_user_owns_order(uuid) to authenticated;
revoke all on function public.ql_staff_can_view_order(uuid) from public, anon;
grant execute on function public.ql_staff_can_view_order(uuid) to authenticated;

-- Enable realtime for order and per-item status changes. Existing project tables are untouched.
do $$ begin
  alter publication supabase_realtime add table public.ql_orders;
exception when duplicate_object then null; when undefined_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.ql_order_items;
exception when duplicate_object then null; when undefined_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.ql_notifications;
exception when duplicate_object then null; when undefined_object then null; end $$;
