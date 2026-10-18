# QueueLess Full-Stack v34 — upgrade notes

This build keeps the HTML/CSS/vanilla-JS UI and uses Node.js + Express + MongoDB/Mongoose + bcryptjs + JWT.

## Reuse your existing environment file

If your previous working QueueLess MongoDB project already has `server/.env`, copy that file into this project's `server/.env`. It can be reused as-is when it points to the same MongoDB Atlas cluster and contains the same variable names. Do not upload or share the real `.env` file.

Keep these values from the previous project:
- `MONGODB_URI`
- `MONGODB_DB`
- `JWT_SECRET`
- `ADMIN_EMAILS`
- `APP_BASE_URL`
- SMTP variables, if you already configured email verification

Make sure `ADMIN_EMAILS` includes the trusted admin email. The admin signs up normally and verifies their email; logging in with an allowlisted email gives them Admin access.

## Run

From the project root (the folder with `package.json`):

```bash
npm install
npm start
```

Open `http://localhost:3000`.

## Staff approval

1. A staff member registers as a normal account first.
2. Sign in with the admin account.
3. Open **Admin Dashboard → Staff Access**.
4. Enter the staff member's exact signup email, choose C1–C4, and click **Approve as Staff**.
5. Ask the staff member to sign out and back in.

Revoke access from the same page. Approval/revocation is handled by protected Express routes; no per-staff SQL query is needed.

## Demo payment

Checkout shows **Demo payment · no charge**. This does not connect to a real payment provider or charge money. Orders are saved in MongoDB with `paymentMethod: demo`.

## Included checks

Run `npm test` and `npm run check:js`. The automated checks cover route/config contracts and JavaScript syntax; they do not replace a live end-to-end test against your Atlas cluster.
