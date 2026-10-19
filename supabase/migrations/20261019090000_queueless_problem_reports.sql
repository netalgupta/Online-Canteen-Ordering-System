create table if not exists public.ql_problem_reports (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 student_name text not null default '',
 student_email text not null default '',
 problem_type text not null,
 order_reference text,
 description text not null check (length(trim(description)) > 0),
 status text not null default 'open' check (status in ('open','in_progress','resolved')),
 admin_note text not null default '',
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists ql_problem_reports_created_idx on public.ql_problem_reports(created_at desc);
alter table public.ql_problem_reports enable row level security;
revoke all on public.ql_problem_reports from anon, public;
grant select, insert, update on public.ql_problem_reports to authenticated;
drop policy if exists ql_problem_reports_student_insert on public.ql_problem_reports;
create policy ql_problem_reports_student_insert on public.ql_problem_reports for insert to authenticated with check (user_id=auth.uid());
drop policy if exists ql_problem_reports_student_read_own on public.ql_problem_reports;
create policy ql_problem_reports_student_read_own on public.ql_problem_reports for select to authenticated using (user_id=auth.uid() or public.ql_my_role()='admin');
drop policy if exists ql_problem_reports_admin_update on public.ql_problem_reports;
create policy ql_problem_reports_admin_update on public.ql_problem_reports for update to authenticated using (public.ql_my_role()='admin') with check (public.ql_my_role()='admin');
