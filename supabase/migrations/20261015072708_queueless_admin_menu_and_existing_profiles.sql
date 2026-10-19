-- Backfill existing accounts as least-privileged students; role elevation remains a trusted admin operation.
insert into public.ql_profiles(user_id,full_name,role)
select u.id,coalesce(nullif(u.raw_user_meta_data->>'full_name',''),split_part(coalesce(u.email,'Student'),'@',1),'Student'),'student'
from auth.users u on conflict(user_id) do nothing;

create or replace function public.ql_admin_save_menu_item(p_id text,p_name text,p_category text,p_price integer,p_prep_time_minutes integer,p_available boolean,p_popular boolean,p_description text,p_image_url text)
returns public.ql_menu_items language plpgsql security definer set search_path=public,auth,pg_temp as $$
declare v_counter text; v_row public.ql_menu_items%rowtype;
begin
 if auth.uid() is null or public.ql_my_role()<>'admin' then raise exception 'FORBIDDEN' using errcode='42501'; end if;
 if p_price<0 or p_prep_time_minutes<1 or p_prep_time_minutes>180 then raise exception 'INVALID_MENU_VALUES'; end if;
 v_counter:=case when p_category in ('Packaged Snacks','Desserts') then 'C1' when p_category in ('Frankie Counter','Juices') then 'C2' when p_category='Chaat Items' then 'C3' else 'C4' end;
 insert into public.ql_menu_items(id,name,category,price,prep_time_minutes,available,popular,description,image_url,counter_id) values(p_id,p_name,p_category,p_price,p_prep_time_minutes,p_available,p_popular,p_description,p_image_url,v_counter)
 on conflict(id) do update set name=excluded.name,category=excluded.category,price=excluded.price,prep_time_minutes=excluded.prep_time_minutes,available=excluded.available,popular=excluded.popular,description=excluded.description,image_url=excluded.image_url,counter_id=excluded.counter_id returning * into v_row;
 return v_row;
end $$;
revoke all on function public.ql_admin_save_menu_item(text,text,text,integer,integer,boolean,boolean,text,text) from public,anon;
grant execute on function public.ql_admin_save_menu_item(text,text,text,integer,integer,boolean,boolean,text,text) to authenticated;
create or replace function public.ql_staff_update_menu_item(p_id text,p_available boolean,p_prep_time_minutes integer)
returns public.ql_menu_items language plpgsql security definer set search_path=public,auth,pg_temp as $$
declare v_row public.ql_menu_items%rowtype;
begin
 if auth.uid() is null or public.ql_my_role()<>'staff' then raise exception 'FORBIDDEN' using errcode='42501'; end if;
 if p_prep_time_minutes<1 or p_prep_time_minutes>180 then raise exception 'INVALID_PREP_TIME'; end if;
 update public.ql_menu_items set available=p_available,prep_time_minutes=p_prep_time_minutes where id=p_id and counter_id=public.ql_my_counter() returning * into v_row;
 if not found then raise exception 'ITEM_NOT_ASSIGNED_TO_COUNTER'; end if; return v_row;
end $$;
revoke all on function public.ql_staff_update_menu_item(text,boolean,integer) from public,anon;
grant execute on function public.ql_staff_update_menu_item(text,boolean,integer) to authenticated;
revoke insert,delete on public.ql_menu_items from authenticated;
revoke update on public.ql_menu_items from authenticated;
