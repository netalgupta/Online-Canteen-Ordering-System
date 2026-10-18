alter table public.ql_profiles
  add column if not exists email text,
  add column if not exists requested_role text not null default 'student'
    check (requested_role in ('student','staff','admin')),
  add column if not exists requested_counter text
    check (requested_counter is null or requested_counter in ('C1','C2','C3','C4'));

update public.ql_profiles p
set email = lower(u.email)
from auth.users u
where u.id = p.user_id and p.email is distinct from lower(u.email);

create unique index if not exists ql_profiles_email_lower_idx
  on public.ql_profiles (lower(email))
  where email is not null;

create or replace function public.ql_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_requested_role text := new.raw_user_meta_data ->> 'requested_role';
  v_requested_counter text := new.raw_user_meta_data ->> 'requested_counter';
begin
  if v_requested_role not in ('student','staff','admin') then
    v_requested_role := 'student';
  end if;
  if v_requested_counter not in ('C1','C2','C3','C4') then
    v_requested_counter := null;
  end if;
  insert into public.ql_profiles(user_id,email,full_name,roll_number,role,requested_role,requested_counter)
  values (
    new.id,
    lower(new.email),
    coalesce(nullif(new.raw_user_meta_data->>'full_name',''), 'Student'),
    nullif(new.raw_user_meta_data->>'roll_number',''),
    'student',
    coalesce(v_requested_role,'student'),
    v_requested_counter
  )
  on conflict (user_id) do update
    set email = excluded.email,
        full_name = excluded.full_name,
    roll_number = coalesce(excluded.roll_number, public.ql_profiles.roll_number),
        requested_role = excluded.requested_role,
        requested_counter = excluded.requested_counter;
  return new;
end;
$$;

drop policy if exists ql_profiles_update_self on public.ql_profiles;
create policy ql_profiles_update_self on public.ql_profiles
  for update to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and role = public.ql_my_role()
    and counter_id is not distinct from public.ql_my_counter()
  );

revoke update on public.ql_profiles from authenticated;
grant update (full_name, phone, roll_number) on public.ql_profiles to authenticated;

create or replace function public.ql_admin_list_profiles(
  p_requested_role text default null,
  p_email text default null
)
returns table (
  user_id uuid,
  email text,
  full_name text,
  role text,
  requested_role text,
  requested_counter text,
  counter_id text,
  verified boolean,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
begin
  if auth.uid() is null or public.ql_my_role() <> 'admin' then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if p_requested_role is not null and p_requested_role not in ('student','staff','admin') then
    raise exception 'INVALID_ROLE_FILTER';
  end if;
  return query
    select p.user_id, lower(u.email), p.full_name, p.role, p.requested_role,
           p.requested_counter, p.counter_id, u.email_confirmed_at is not null, p.created_at
    from public.ql_profiles p
    join auth.users u on u.id = p.user_id
    where (p_requested_role is null or p.requested_role = p_requested_role)
      and (p_email is null or lower(u.email) = lower(p_email))
    order by p.created_at desc
    limit case when p_email is null then 200 else 1 end;
end;
$$;

create or replace function public.ql_admin_update_profile(
  p_user_id uuid,
  p_role text,
  p_counter_id text default null
)
returns public.ql_profiles
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_profile public.ql_profiles%rowtype;
begin
  if auth.uid() is null or public.ql_my_role() <> 'admin' then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if p_role not in ('student','staff','admin') then
    raise exception 'INVALID_ROLE';
  end if;
  if p_role = 'staff' and p_counter_id not in ('C1','C2','C3','C4') then
    raise exception 'STAFF_COUNTER_REQUIRED';
  end if;
  if p_role <> 'staff' then
    p_counter_id := null;
  end if;
  update public.ql_profiles
  set role = p_role, counter_id = p_counter_id
  where user_id = p_user_id
  returning * into v_profile;
  if not found then
    raise exception 'PROFILE_NOT_FOUND';
  end if;
  return v_profile;
end;
$$;

revoke all on function public.ql_admin_list_profiles(text,text) from public, anon;
grant execute on function public.ql_admin_list_profiles(text,text) to authenticated;
revoke all on function public.ql_admin_update_profile(uuid,text,text) from public, anon;
grant execute on function public.ql_admin_update_profile(uuid,text,text) to authenticated;
