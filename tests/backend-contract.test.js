const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const server = read('server/server.js');
const migration = read('supabase/migrations/20261018000000_queueless_supabase_api.sql');
const staffRequestMigration = read('supabase/migrations/20261019000000_queueless_staff_requests.sql');
const coreMigration = read('supabase/migrations/20261015072637_queueless_core_backend.sql');

test('the active app starts Express with Supabase and no Mongo runtime dependencies', () => {
  const pkg = JSON.parse(read('package.json'));
  for (const dependency of ['express', 'express-rate-limit', 'dotenv', '@supabase/supabase-js']) {
    assert.ok(pkg.dependencies[dependency]);
  }
  for (const dependency of ['mongoose', 'bcryptjs', 'jsonwebtoken', 'nodemailer']) {
    assert.equal(pkg.dependencies[dependency], undefined);
  }
  assert.match(pkg.scripts.start, /server\/server\.js/);
  assert.match(server, /createClient\(supabaseUrl, supabaseKey/);
  assert.match(server, /QueueLess Supabase API/);
});

test('server configuration only uses the Supabase publishable or anon key', () => {
  const example = read('server/.env.example');
  assert.match(example, /SUPABASE_URL=/);
  assert.match(example, /SUPABASE_PUBLISHABLE_KEY=/);
  assert.doesNotMatch(example, /SERVICE_ROLE|SECRET_KEY|MONGODB|JWT_SECRET/);
  assert.doesNotMatch(server, /SUPABASE_SERVICE_ROLE|service_role/i);
});

test('authenticated API requests verify the Supabase user and query their RLS-scoped profile', () => {
  assert.match(server, /authClient\.auth\.getUser\(token\)/);
  assert.match(server, /Authorization: `Bearer /);
  assert.match(server, /\.from\('ql_profiles'\)/);
  assert.match(server, /if \(!allowed\.includes\(req\.profile\.role\)\)/);
  assert.match(server, /function profileLookupFailure\(error\)/);
  assert.match(server, /Could not read your QueueLess profile/);
  assert.match(server, /No QueueLess profile was found/);
});

test('public signup is student-only and enforces Somaiya/password rules', async () => {
  const { getPasswordPolicyError, isSomaiyaEmail } = await import('../server/src/utils/authValidation.js');
  assert.equal(isSomaiyaEmail('student@somaiya.edu'), true);
  assert.equal(isSomaiyaEmail('STUDENT@SOMAIYA.EDU'), true);
  assert.equal(isSomaiyaEmail('student@sub.somaiya.edu'), false);
  assert.equal(isSomaiyaEmail('student@example.com'), false);
  assert.equal(getPasswordPolicyError('Campus!2026'), null);
  assert.match(getPasswordPolicyError('campus!2026'), /uppercase/i);
  assert.match(getPasswordPolicyError('Campus2026'), /special character/i);
  assert.match(getPasswordPolicyError('Short!A'), /8 characters/i);
  assert.match(server, /if \(!isSomaiyaEmail\(email\)\)/);
  assert.match(server, /getPasswordPolicyError\(password\)/);
  assert.match(server, /requested_role: 'student'/);
  assert.match(server, /app\.post\('\/api\/auth\/register-staff'/);
  assert.match(server, /requested_role: 'staff'/);
  assert.match(server, /requested_counter: requestedCounter/);
  assert.match(server, /rejectPendingStaffRequest\(req\)/);
  assert.match(server, /matches\[0\]\.requested_role !== 'staff'/);
  assert.match(server, /app\.post\('\/api\/auth\/staff-request', auth/);
  assert.match(server, /rpc\('ql_request_staff_access'/);
  assert.match(server, /Your staff access request is awaiting admin approval/);
  assert.match(staffRequestMigration, /auth\.uid\(\) is null/);
  assert.match(staffRequestMigration, /public\.ql_my_role\(\) <> 'student'/);
  assert.match(staffRequestMigration, /grant execute on function public\.ql_request_staff_access\(text\) to authenticated/);
  assert.match(staffRequestMigration, /requested_role = 'student',\s+requested_counter = null/);
  assert.match(migration, /'student',\s*coalesce\(v_requested_role,'student'\)/);
  const registration = read('register.html');
  assert.doesNotMatch(registration, /name="role"|value="staff"|value="admin"|requestedRole:role/);
  const staffRegistration = read('staff-register.html');
  assert.match(staffRegistration, /requestedCounter/);
  assert.match(staffRegistration, /registerStaff/);
  assert.match(staffRegistration, /requestStaffAccess/);
  assert.match(staffRegistration, /signupError\.status!==409/);
  assert.match(staffRegistration, /qlRoleHome\(user\.role,user\)/);
  assert.match(read('js/auth.js'), /pendingApproval\)return '\/staff-pending\.html'/);
  assert.match(read('staff-pending.html'), /Refresh approval status/);
  assert.match(read('admin/staff-access.js'), /Staff request pending/);
  assert.match(read('admin/staff-access.js'), /Review request/);
  assert.match(read('admin/staff-access.html'), /Review staff access requests/);
});

test('OTP routes are rate-limited and use Supabase Auth verification/resend', () => {
  assert.match(server, /from 'express-rate-limit'/);
  assert.match(server, /\/api\/auth\/verify-otp', otpLimiter/);
  assert.match(server, /\/api\/auth\/resend-otp', resendOtpLimiter/);
  assert.match(server, /auth\.verifyOtp\(\{ email, token, type: 'email' \}\)/);
  assert.match(server, /auth\.resend\(\{ type: 'signup', email \}\)/);
});

test('role and email changes are protected by narrow profile grants and admin RPCs', () => {
  assert.match(migration, /revoke update on public\.ql_profiles from authenticated/);
  assert.match(migration, /grant update \(full_name, phone, roll_number\)/);
  assert.match(migration, /auth\.uid\(\) is null or public\.ql_my_role\(\) <> 'admin'/);
  assert.match(migration, /ql_admin_update_profile/);
  assert.match(migration, /ql_admin_list_profiles/);
  assert.match(server, /\/api\/admin\/staff-access\/approve/);
  assert.match(server, /\/api\/admin\/staff-access\/:userId\/revoke/);
  assert.match(server, /roles\('admin'\)/);
});

test('only the designated email can be granted admin access by the admin RPC', () => {
  const migration = read('supabase/migrations/20261020000000_queueless_fixed_admin.sql');
  assert.match(migration, /p_role = 'admin' and not exists[\s\S]*lower\(u\.email\) = 'arya\.km@somaiya\.edu'/);
  assert.match(read('README.md'), /and lower\(u\.email\) = 'arya\.km@somaiya\.edu'/);
});

test('menu and order handlers use the existing RLS-protected tables and RPCs', () => {
  assert.match(server, /from\('ql_menu_items'\)/);
  assert.match(server, /rpc\('ql_admin_save_menu_item'/);
  assert.match(server, /rpc\('ql_staff_update_menu_item'/);
  assert.match(server, /rpc\('ql_create_order'/);
  assert.match(server, /rpc\('ql_update_item_status'/);
  assert.match(coreMigration, /pg_advisory_xact_lock/);
  assert.match(coreMigration, /PICKUP_SLOT_FULL/);
  assert.match(coreMigration, /create policy ql_orders_read_owner_staff_admin/);
  assert.match(coreMigration, /create policy ql_order_items_read_owner_counter_admin/);
});

test('browser pages use the same-origin API adapter without a hard-coded Supabase client', () => {
  const auth = read('js/supabase-auth.js');
  const backend = read('js/backend.js');
  assert.match(auth, /fetch\(`\/api\$\{path\}`/);
  assert.match(auth, /ql_supabase_token/);
  assert.match(auth, /ql_supabase_refresh_token/);
  assert.match(auth, /\/auth\/refresh/);
  assert.match(backend, /QL_BACKEND_ENABLED = true/);
  assert.match(backend, /ql_supabase_refresh_token/);
  assert.match(backend, /\/auth\/refresh/);
  assert.match(backend, /\/orders\/mine/);
  assert.match(backend, /currentUser\.pendingApproval/);
  assert.match(backend, /\/orders\/queue/);
  assert.match(backend, /\/menu/);
  assert.doesNotMatch(auth, /supabase\.co|publishable|anon key/i);
  assert.doesNotMatch(read('login.html'), /@supabase\/supabase-js|qlMongoAuth/);
  assert.doesNotMatch(read('register.html'), /@supabase\/supabase-js|qlMongoAuth/);
  assert.match(read('student/change-password.html'), /updatePassword\(current,n\)/);
});

test('clean login and registration URLs redirect to their static pages', () => {
  assert.match(server, /app\.get\('\/login', \(_req, res\) => res\.redirect\(302, '\/login\.html'\)\)/);
  assert.match(server, /app\.get\('\/register', \(_req, res\) => res\.redirect\(302, '\/register\.html'\)\)/);
  for (const role of ['student', 'staff', 'admin']) {
    assert.ok(server.includes(
      `app.get('/${role}/dashboard', (_req, res) => res.redirect(302, '/${role}/dashboard.html'))`
    ));
  }
});

test('inline JavaScript in auth and staff-access pages parses', () => {
  for (const file of ['login.html', 'register.html', 'staff-register.html', 'staff-pending.html', 'admin/staff-access.html']) {
    const html = read(file);
    const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
      .map(match => match[1])
      .filter(source => source.trim());
    for (const [index, source] of scripts.entries()) {
      assert.doesNotThrow(() => new vm.Script(source, { filename: `${file} inline script ${index + 1}` }));
    }
  }
  for (const file of ['admin/staff-access.js', 'js/supabase-auth.js', 'js/auth.js', 'js/backend.js']) {
    assert.doesNotThrow(() => new vm.Script(read(file), { filename: file }));
  }
});

test('the Supabase menu seed and four counters are present', () => {
  const seed = read('supabase/seed.sql');
  assert.match(seed, /insert into public\.ql_menu_items/);
  for (const id of ['C1', 'C2', 'C3', 'C4']) {
    assert.match(read('js/data.js'), new RegExp(id + ': \\{'));
  }
});

test('order API sends client quantities but leaves prices and capacity to Postgres', () => {
  assert.match(server, /menuItemId: String\(item\.id \|\| item\.menuItemId \|\| ''\)/);
  assert.match(server, /p_items: items/);
  assert.doesNotMatch(server, /total\s*=\s*items\.reduce/);
  assert.match(coreMigration, /v_total := v_total \+ v_menu\.price\*v_qty/);
});
