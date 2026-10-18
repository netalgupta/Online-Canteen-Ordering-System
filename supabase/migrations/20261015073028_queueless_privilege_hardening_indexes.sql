revoke all on function public.ql_handle_new_user() from public, anon, authenticated;
revoke update on public.ql_notifications from authenticated;
grant update(read_at) on public.ql_notifications to authenticated;
create index if not exists ql_menu_counter_idx on public.ql_menu_items(counter_id);
create index if not exists ql_profiles_counter_idx on public.ql_profiles(counter_id);
create index if not exists ql_events_item_idx on public.ql_order_item_events(order_item_id);
create index if not exists ql_notifications_order_idx on public.ql_notifications(order_id);
create index if not exists ql_notifications_item_idx on public.ql_notifications(order_item_id);
create index if not exists ql_events_changed_by_idx on public.ql_order_item_events(changed_by);
