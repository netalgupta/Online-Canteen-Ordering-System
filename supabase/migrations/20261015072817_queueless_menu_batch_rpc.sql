create or replace function public.ql_admin_upsert_menu(p_items jsonb)
returns integer language plpgsql security definer set search_path=public,auth,pg_temp as $$
declare v_item jsonb; v_counter text; v_count integer:=0;
begin
 if auth.uid() is null or public.ql_my_role()<>'admin' then raise exception 'FORBIDDEN' using errcode='42501';end if;
 if jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items)>500 then raise exception 'INVALID_MENU_BATCH';end if;
 for v_item in select value from jsonb_array_elements(p_items) loop
  if coalesce(v_item->>'id','')='' or coalesce(v_item->>'name','')='' then raise exception 'INVALID_MENU_ITEM';end if;
  v_counter:=case when v_item->>'category' in ('Packaged Snacks','Desserts') then 'C1' when v_item->>'category' in ('Frankie Counter','Juices') then 'C2' when v_item->>'category'='Chaat Items' then 'C3' else 'C4' end;
  insert into public.ql_menu_items(id,name,category,price,prep_time_minutes,veg,available,popular,description,image_url,counter_id)
  values(v_item->>'id',v_item->>'name',v_item->>'category',(v_item->>'price')::integer,coalesce((v_item->>'prep_time_minutes')::integer,5),coalesce((v_item->>'veg')::boolean,true),coalesce((v_item->>'available')::boolean,true),coalesce((v_item->>'popular')::boolean,false),v_item->>'description',v_item->>'image_url',v_counter)
  on conflict(id) do update set name=excluded.name,category=excluded.category,price=excluded.price,prep_time_minutes=excluded.prep_time_minutes,veg=excluded.veg,available=excluded.available,popular=excluded.popular,description=excluded.description,image_url=excluded.image_url,counter_id=excluded.counter_id;
  v_count:=v_count+1;
 end loop; return v_count;
end $$;
revoke all on function public.ql_admin_upsert_menu(jsonb) from public,anon;
grant execute on function public.ql_admin_upsert_menu(jsonb) to authenticated;
create or replace function public.ql_admin_mark_menu_unavailable(p_id text)
returns boolean language plpgsql security definer set search_path=public,auth,pg_temp as $$
begin if auth.uid() is null or public.ql_my_role()<>'admin' then raise exception 'FORBIDDEN' using errcode='42501';end if; update public.ql_menu_items set available=false where id=p_id;return found;end $$;
revoke all on function public.ql_admin_mark_menu_unavailable(text) from public,anon;
grant execute on function public.ql_admin_mark_menu_unavailable(text) to authenticated;
