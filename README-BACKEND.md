# QueueLess Supabase backend design note (not the active server)

> This is a historical Supabase/PostgreSQL design reference. The root `npm start` command on this branch currently runs the Express + MongoDB backend described in `README.md`; this document does not describe that server's runtime configuration.

This branch-ready package keeps the existing HTML/CSS/vanilla-JS frontend and adds a Supabase/PostgreSQL backend foundation. It uses the existing SkipQ Supabase project without dropping or rewriting the existing `orders`, `order_items`, `menu_items`, `counters`, or `token_counter` tables.

## Current backend pieces

- Supabase Auth for persistent email/password accounts, sessions, email verification and password recovery.
- `ql_profiles`, with roles defaulting to `student`; public signup cannot self-assign `staff` or `admin`.
- Four QueueLess counters and separate `ql_menu_items`, `ql_orders`, `ql_order_items`, status events and notifications.
- RLS policies on QueueLess tables; the student can read only their own orders, and staff can read/update items assigned to their counter.
- `ql_create_order` validates menu prices and quantities on the server and locks a pickup slot transactionally before enforcing the limit of 10 orders per 7-minute slot.
- `ql_update_item_status` enforces the Received → Accepted → Preparing → Ready → Collected transition. Only an authorized staff member for that counter or an admin can advance a status; estimated times never set Ready automatically.
- Supabase Realtime publication for order/item/notification changes.
- Public landing page SEO metadata and a robots.txt foundation. Domain-dependent canonical URLs, sitemap submission and Search Console are intentionally deferred until hosting.

## Important setup before first real login

1. In Supabase Auth settings, configure the allowed site URL and redirect URLs for your local development origin. Do not set a production domain until one exists.
2. Configure a production SMTP provider before relying on verification and recovery emails at scale.
3. Promote one trusted account to the first QueueLess admin through the Supabase SQL editor. Replace the placeholder with the exact email for that account:

```sql
update public.ql_profiles p
set role = 'admin', counter_id = null
from auth.users u
where u.id = p.user_id
  and lower(u.email) = lower('YOUR_ADMIN_EMAIL');
```

4. Sign in as that admin in QueueLess. If the QueueLess menu table is empty, the adapter seeds the existing 159-item local menu through the admin-only bulk RPC. Check the menu table after first admin sign-in.
5. Create staff accounts as normal signups, then assign their role and counter from the trusted SQL editor/admin workflow. Example:

```sql
update public.ql_profiles p
set role = 'staff', counter_id = 'C3'
from auth.users u
where u.id = p.user_id
  and lower(u.email) = lower('YOUR_STAFF_EMAIL');
```

Never let a public registration form assign staff/admin privileges. Do not put a Supabase service-role/secret key in the frontend.

## Run locally

Because this is a static site, serve the `queueless/` folder with a local HTTP server (not `file://`) so browser auth redirects and modules work consistently. The frontend uses the public publishable key in `js/backend-config.js`; this key is intended to be public and is not a service-role secret. RLS is mandatory.

## Migration files

`supabase/migrations/` contains additive migrations. `supabase/seed.sql` contains the menu seed. Existing SkipQ tables and their current policies are not removed by these migrations. The legacy SkipQ tables were found to have broad public policies during inspection; they are isolated from the new QueueLess tables, but should be separately reviewed before using those legacy tables with real customer data.

## Known follow-up before production

- Test the full user journey in a browser using real student/staff/admin accounts.
- Validate the production email provider, Auth redirect URLs, recovery flow and leaked-password protection setting.
- Audit and tighten the legacy SkipQ table policies without breaking that app.
- Add automated integration/load tests against a disposable development project, including concurrent slot bookings.
- Verify that all account/profile/settings pages use backend persistence rather than demo-only localStorage preferences.
- Add canonical URLs and a production sitemap only after the real domain is known.
