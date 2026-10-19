# QueueLess v36 — Supabase demo

This build uses the existing **SkipQ** Supabase project for Supabase Auth, PostgreSQL orders, menu items, staff/admin roles, and staff-visible order tracking. Payment is demo-only (`demo-no-charge`): no money is collected and no payment gateway is called.

## Run locally
1. Extract this ZIP to a new folder (do not overwrite your MongoDB folder).
2. Open the extracted folder in VS Code.
3. Use the Live Server extension to open `index.html` (or any static HTTP server). Do not open pages with `file://`.
4. Sign in with your existing Supabase account. Supabase sends email verification/reset messages according to the Auth settings in the connected project.

## Admin and staff
- The existing `aryamenon1330@gmail.com` account is already assigned the `admin` role in `public.ql_profiles`.
- Admins can approve an already-registered email as staff from Admin → Staff Access, assign C1–C4, and revoke staff access.
- Staff see orders containing items routed to their assigned counter; admins can see all orders. Students see their own orders.
- Staff control status changes, including “Mark Ready”; status is not auto-completed by a timer.

## Database
The QueueLess tables use the `ql_` prefix and are separate from the original SkipQ tables. The checkout RPC validates the selected menu items, reserves capacity transactionally (10 orders per selected slot), stores order items, and returns the order token. Existing `public.ql_menu_items` has 159 menu rows, so this build does not re-seed or overwrite the menu automatically.

## Safety
`js/backend-config.js` contains only the Supabase URL and public publishable key. Never put a service-role/secret key in the browser.
