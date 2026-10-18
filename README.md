# QueueLess — Express + Supabase

QueueLess is a vanilla HTML/CSS/JavaScript canteen-ordering app served by an Express server. Supabase Auth owns accounts and sessions; Supabase Postgres stores profiles, menu items, and orders. Postgres Row Level Security (RLS) and restricted RPCs enforce data access and staff/admin actions.

## Requirements

- Node.js 18 or newer
- A Supabase project with permission to apply the migrations in `supabase/migrations/`

## Configure Supabase

1. Apply the SQL migrations in filename order, including `20261018000000_queueless_supabase_api.sql`. They add QueueLess-specific tables and functions; they do not replace the legacy SkipQ tables.
2. Run `supabase/seed.sql` once in the Supabase SQL editor to add the initial QueueLess menu.
3. In Supabase Auth, allow the local URL `http://localhost:3000`. For six-digit signup codes, configure the signup email template to include `{{ .Token }}`; verification emails are sent by Supabase Auth.
4. Register a Somaiya account through QueueLess. Promote the first trusted admin from the Supabase SQL editor:

   ```sql
   update public.ql_profiles p
   set role = 'admin', counter_id = null
   from auth.users u
   where u.id = p.user_id
     and lower(u.email) = lower('YOUR_ADMIN_EMAIL');
   ```

The app enforces `@somaiya.edu` addresses and passwords with at least eight characters, an uppercase letter, and a special character. Public registration is for students only. Staff accounts are created by an administrator as confirmed Supabase Auth users, then granted staff access and a counter through the staff-access page; staff do not use student registration or OTP signup.

## Run locally

```powershell
npm install
Copy-Item server\.env.example server\.env
```

Set `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` in `server/.env` using the project URL and publishable (or legacy anon) key from Supabase **Project Settings → API Keys**. `APP_BASE_URL` defaults to `http://localhost:3000`.

The Node server uses only the public publishable/anon key and the signed-in user's access token. **Do not put a service-role/secret key in the app or commit it.** Supabase RLS policies and server-guarded RPCs are the authorization boundary.

```powershell
npm start
```

Open `http://localhost:3000`; do not open the HTML files through `file://`.

## Backend routes

- `/api/auth/*`: registration, OTP verification/resend, login, profile, and password updates
- `/api/menu`: public menu reads; admin/staff menu writes use role-checked RPCs
- `/api/orders`: transactional order creation, personal order history, staff queue, and item status transitions
- `/api/admin/staff-access`: admin-only account listing, staff approval, counter assignment, and revocation

The browser calls the same-origin Express API. It does not contain Supabase credentials or access database tables directly. User-scoped requests carry the Supabase access token; RLS ensures students see only their own orders and counter staff can update only their assigned items. Order creation validates current menu prices and pickup-slot capacity transactionally in `ql_create_order`.

## Verification

```powershell
npm run check:js
npm test
npm audit
```

Live signup, email delivery, database queries, and order flows require a configured Supabase project and the migrations above.
