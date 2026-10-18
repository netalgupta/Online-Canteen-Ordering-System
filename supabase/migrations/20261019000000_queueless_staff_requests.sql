create or replace function public.ql_request_staff_access(p_counter_id text)
returns void
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED' using errcode = '28000';
  end if;
  if p_counter_id is null or p_counter_id not in ('C1','C2','C3','C4') then
    raise exception 'INVALID_COUNTER';
  end if;
  if public.ql_my_role() <> 'student' then
    raise exception 'STUDENT_ACCOUNT_REQUIRED';
  end if;
  update public.ql_profiles
  set requested_role = 'staff',
      requested_counter = p_counter_id
  where user_id = auth.uid();
  if not found then
    raise exception 'PROFILE_NOT_FOUND';
  end if;
end;
$$;

revoke all on function public.ql_request_staff_access(text) from public, anon;
grant execute on function public.ql_request_staff_access(text) to authenticated;

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
  set role = p_role,
      counter_id = p_counter_id,
      requested_role = 'student',
      requested_counter = null
  where user_id = p_user_id
  returning * into v_profile;
  if not found then
    raise exception 'PROFILE_NOT_FOUND';
  end if;
  return v_profile;
end;
$$;
