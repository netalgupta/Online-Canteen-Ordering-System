# QueueLess backend

The active runtime is the root Express app (`npm start`) connected to Supabase Auth and Postgres. This replaces the old MongoDB demo. See [README.md](./README.md) for local setup and the Supabase migration steps.

## Runtime design

- `server/server.js` serves the static app and the same-origin `/api` routes.
- Supabase Auth handles password hashing, signup confirmation, OTP verification, sessions, and email delivery.
- The server uses only the Supabase publishable/anon key. Authenticated database requests use the caller's access token, so RLS evaluates the actual user. No service-role key is required or accepted by the runtime.
- `ql_profiles.role` is always initialized to `student` for public signup. Staff accounts are created as confirmed Supabase Auth users by an administrator, then granted staff access and counter assignment through admin-only SQL RPCs. Public users cannot request or self-grant privileged roles.
- `ql_menu_items`, `ql_orders`, and `ql_order_items` are separate QueueLess tables. Menu staff actions use role-checked RPCs; order creation and item-status changes use transactional/role-checked RPCs.
- Auth and OTP endpoints are rate-limited. The backend and frontend both validate Somaiya email addresses and the password policy.

## Database setup

Apply the migrations in `supabase/migrations/` in order and then execute `supabase/seed.sql` once. To grant the initial administrator, first create and confirm their account in Supabase Auth, then run this query in the trusted Supabase SQL editor:

```sql
update public.ql_profiles p
set role = 'admin', counter_id = null
from auth.users u
where u.id = p.user_id
  and lower(u.email) = lower('YOUR_ADMIN_EMAIL');
```

RLS is required; do not disable it. QueueLess migrations add prefixed `ql_*` objects and do not replace SkipQ's existing tables. Supabase's signup email template must include `{{ .Token }}` for the six-digit code UI.

## Local setup

Copy `server/.env.example` to `server/.env`, set `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`, then run `npm install` and `npm start`. Keep `server/.env` private and out of Git. Never put a service-role/secret key in frontend code. To add staff without OTP signup, an administrator creates a confirmed user under Supabase Dashboard → Authentication → Users, then assigns the staff role and counter in QueueLess Staff Access. Share initial credentials securely and have the user change the password after sign-in.

Run `npm run check:js`, `npm test`, and `npm audit` to validate the local contracts. End-to-end authentication and data operations additionally require a configured Supabase project.
