# QueueLess — MongoDB + Express project demo

This version keeps the existing HTML/CSS/vanilla-JavaScript UI and connects it to an Express API backed by MongoDB Atlas. **React is not required** for this architecture: React is a frontend library, while Express/Mongoose/bcrypt are backend packages. The frontend is served by Express so it should be opened at `http://localhost:3000`, not by double-clicking `index.html` (`file://`).

## Included in this demo

- Express server and REST API
- MongoDB/Mongoose models for users, menu items, and orders
- bcrypt password hashing and JWT authentication
- Email verification using SMTP (or a local-only verification link when SMTP is not configured)
- Server-side role checks for student, staff, and admin endpoints
- Admin email allowlist, supporting comma-separated addresses in `ADMIN_EMAILS`
- Automatic first-run import of the 159 menu seed records into the `queueless_demo` database, only if the menu collection is empty
- Menu, checkout/order creation, staff queue, and status APIs
- Four-counter routing and pickup-slot validation in the order endpoint
- Admin Dashboard → Staff Access: approve a registered account, assign C1–C4, list accounts, and revoke staff access without a per-staff SQL query
- Demo payment option: no payment gateway and no real charge; the order is still stored in MongoDB

## 1. Start your MongoDB Atlas cluster

The connected Atlas `Cluster0` was reported paused when checked. Open MongoDB Atlas → **Database → Cluster0** and resume/start it. In **Connect → Drivers → Node.js**, copy the connection string. Ensure your current IP is permitted under Network Access and that you have a database user. Never paste the URI into frontend JavaScript or commit it to Git.

## 2. Install and configure

From the project root folder (the folder containing this README):

```bash
npm install
```

Copy `server/.env.example` to `server/.env`, then edit `server/.env`:

- `MONGODB_URI`: your Atlas connection string
- `MONGODB_DB=queueless_demo`
- `JWT_SECRET`: replace with a long random value of at least 32 characters
- `ADMIN_EMAILS=aryamenon1330@gmail.com` (add more addresses separated by commas if needed)
- `APP_BASE_URL=http://localhost:3000`
- Optional SMTP settings for real verification emails: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and `MAIL_FROM`

Do not share or commit `server/.env`.

## 3. Run the app

```bash
npm start
```

Then open `http://localhost:3000`. The first successful server start imports the 159 menu items if the MongoDB menu collection is empty. Subsequent starts preserve the existing menu and admin edits.

For syntax and contract checks:

```bash
npm run check:js
npm test
```

## Authentication and email redirects

Registration creates a Student account unless the email is in the server-side `ADMIN_EMAILS` allowlist. Users cannot grant themselves Staff or Admin access from the registration form. Add the first admin email to `ADMIN_EMAILS` in `server/.env`; on login that account receives Admin role. After that, approve registered staff from **Admin Dashboard → Staff Access**. Do not expose role assignment in public signup. After verifying email, the link redirects to `APP_BASE_URL/login.html?verified=1`, which avoids redirecting to an unrelated localhost port. For actual emails, configure SMTP; otherwise the server returns a local-only verification link for the project demo.

## Current scope and limitations

This is a college-project integration, not a production security certification. Atlas must be running and `.env` correctly configured to test live database operations. The checkout uses a clearly labelled Demo payment option and does not charge money. No payment gateway is connected. The pickup capacity check is appropriate for a single-user classroom demo but should be made transactionally atomic before real concurrent production traffic. Some secondary profile/settings screens may still need feature-specific testing. The old `supabase/` folder is retained as a reference for the later production migration; it is not required to run this MongoDB demo.
