const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
test('backend config contains only public project settings, no service-role secret', () => {
  const s = read('js/backend-config.js');
  assert.match(s, /QL_SUPABASE_URL/);
  assert.match(s, /QL_SUPABASE_PUBLISHABLE_KEY/);
  assert.doesNotMatch(s, /service_role|secret_key|sb_secret/i);
});
test('orders use server RPC in backend mode and retain staff-controlled Ready', () => {
  assert.match(read('js/orders.js'), /qlBackend\.createOrder/);
  assert.match(read('js/orders.js'), /qlBackend\.updateItemStatus/);
  assert.match(read('js/orders.js'), /function qlProcessItemReadiness\(\)[\s\S]*return false/);
});
test('SQL uses transactional slot lock and hard capacity', () => {
  const s = read('supabase/migrations/20261015072637_queueless_core_backend.sql');
  assert.match(s, /pg_advisory_xact_lock/);
  assert.match(s, /v_count\s*>=\s*10/);
  assert.match(s, /ql_create_order/);
});
test('signup cannot assign staff/admin roles', () => {
  assert.doesNotMatch(read('register.html'), /name="role"|id="role-admin"|id="role-staff"/);
  assert.match(read('register.html'), /password\.length<6/);
  assert.match(read('register.html'), /\[A-Z\]/);
  assert.match(read('supabase/migrations/20261015072637_queueless_core_backend.sql'), /default 'student'/);
});
test('counter assignment contains all four canteen counters', () => {
  const s = read('js/data.js');
  for (const id of ['C1','C2','C3','C4']) assert.match(s, new RegExp(id + ': \\{'));
});
test('private app pages are noindex and robots disallows private routes', () => {
  assert.match(read('robots.txt'), /Disallow: \/student\//);
  assert.match(read('student/dashboard.html'), /noindex,nofollow/);
  assert.match(read('index.html'), /name="description"/);
});
