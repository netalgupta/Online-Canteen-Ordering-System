# QueueLess backend

The active runtime is the root Express app (`npm start`) connected to Supabase Auth and Postgres. This replaces the old MongoDB demo. See [README.md](./README.md) for local setup and the Supabase migration steps.

## Runtime design

- `server/server.js` serves the static app and the same-origin `/api` routes.
- Supabase Auth handles password hashing and sessions. Email confirmations should be disabled in project settings for the no-OTP staff request flow; this also disables confirmation for student signup.
- The server uses only the Supabase publishable/anon key. Authenticated database requests use the caller's access token, so RLS evaluates the actual user. No service-role key is required or accepted by the runtime.
- `ql_profiles.role` is always initialized to `student` for public signup. Staff can submit a request with their name, Somaiya email, password, and requested counter. Existing students can sign in on the staff request page to request access too. Pending accounts are blocked from orders and staff tools until an admin grants staff access and assigns a counter through admin-only SQL RPCs. Admin signup is not public; only `arya.km@somaiya.edu` can hold the admin role, and the initial account is promoted through the trusted SQL editor.
- `ql_menu_items`, `ql_orders`, and `ql_order_items` are separate QueueLess tables. Menu staff actions use role-checked RPCs; order creation and item-status changes use transactional/role-checked RPCs.
- Auth and OTP endpoints are rate-limited. The backend and frontend both validate Somaiya email addresses and the password policy.

## Database setup

Apply the migrations in `supabase/migrations/` in order and then execute `supabase/seed.sql` once. Create the `arya.km@somaiya.edu` account through QueueLess, then grant it initial administrator access with this query in the trusted Supabase SQL editor:

```sql
update public.ql_profiles p
set role = 'admin', counter_id = null
from auth.users u
where u.id = p.user_id
  and lower(u.email) = 'arya.km@somaiya.edu';
```

RLS is required; do not disable it. QueueLess migrations add prefixed `ql_*` objects and do not replace SkipQ's existing tables. Disable email confirmations at Authentication → Providers → Email if staff must register without OTP. This changes confirmation behavior for the entire Supabase project.

## Local setup

Copy `server/.env.example` to `server/.env`, set `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`, then run `npm install` and `npm start`. Keep `server/.env` private and out of Git. Never put a service-role/secret key in frontend code. Staff submit requests at `/staff-register`; admins review pending requests in QueueLess Staff Access. Do not add public admin registration.

Run `npm run check:js`, `npm test`, and `npm audit` to validate the local contracts. End-to-end authentication and data operations additionally require a configured Supabase project.
