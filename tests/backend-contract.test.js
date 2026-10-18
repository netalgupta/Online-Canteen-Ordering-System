const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');

test('MongoDB backend dependencies and root npm start are configured', () => {
  const pkg = JSON.parse(read('package.json'));
  for (const dep of ['express','mongoose','bcryptjs','jsonwebtoken','dotenv','nodemailer']) assert.ok(pkg.dependencies[dep]);
  assert.match(pkg.scripts.start, /server\/server\.js/);
});
test('configured admin email is server-side and multiple emails are supported', () => {
  const s = read('server/server.js');
  assert.match(s, /ADMIN_EMAILS.*split\(','\)/);
  assert.match(s, /process\.env\.ADMIN_EMAILS \|\| ''/);
  assert.match(read('server/.env.example'), /ADMIN_EMAILS=your\.name@somaiya\.edu/);
  assert.match(s, /ADMIN_EMAILS\.has\(email\)\?'admin':'student'/);
});
test('passwords are hashed and JWTs are verified server-side', () => {
  const s = read('server/server.js');
  assert.match(s, /bcrypt\.hash\(password,12\)/);
  assert.match(s, /bcrypt\.compare\(password,u\.passwordHash\)/);
  assert.match(s, /jwt\.verify/);
});
test('menu seed has unique ids and at least 100 items', () => {
  const items = JSON.parse(read('server/seed-menu.json'));
  assert.ok(items.length >= 100);
  assert.equal(new Set(items.map(x => x.itemId)).size, items.length);
});
test('MongoDB adapter routes frontend auth, menu and orders through API', () => {
  const b = read('js/backend.js');
  assert.match(b, /\/api/);
  assert.match(b, /\/orders/);
  assert.match(b, /\/menu/);
  assert.match(read('login.html'), /qlMongoAuth\.signIn/);
  assert.match(read('register.html'), /qlMongoAuth\.signUp/);
});
test('registration does not let users self-assign staff/admin roles', () => {
  assert.match(read('register.html'), /role!=='student'/);
  assert.match(read('server/server.js'), /const role=ADMIN_EMAILS\.has\(email\)\?'admin':'student'/);
});
test('auth policy restricts accounts to Somaiya emails and requires strong passwords', async () => {
  const { getPasswordPolicyError, isSomaiyaEmail } = await import('../server/src/utils/authValidation.js');
  assert.equal(isSomaiyaEmail('student@somaiya.edu'), true);
  assert.equal(isSomaiyaEmail('STUDENT@SOMAIYA.EDU'), true);
  assert.equal(isSomaiyaEmail('student@sub.somaiya.edu'), false);
  assert.equal(isSomaiyaEmail('student@example.com'), false);
  assert.equal(getPasswordPolicyError('Campus!2026'), null);
  assert.match(getPasswordPolicyError('campus!2026'), /uppercase/i);
  assert.match(getPasswordPolicyError('Campus2026'), /special character/i);
  assert.match(getPasswordPolicyError('Short!A'), /8 characters/i);
});
test('server auth routes enforce the email and password rules', () => {
  const server = read('server/server.js');
  assert.match(server, /if\(!isSomaiyaEmail\(email\)\)/);
  assert.match(server, /getPasswordPolicyError\(password\)/);
  assert.match(server, /getPasswordPolicyError\(next,'New password'\)/);
  assert.match(read('register.html'), /somaiya\\\.edu/);
  assert.match(read('login.html'), /somaiya\\\.edu/);
  assert.match(read('student/change-password.html'), /updatePassword\(current,n\)/);
});
test('OTP endpoints are rate-limited and OTP hashes are compared in constant time', () => {
  const server = read('server/server.js');
  assert.match(server, /from 'express-rate-limit'/);
  assert.match(server, /\/api\/auth\/verify-otp',otpLimiter/);
  assert.match(server, /\/api\/auth\/resend-otp',resendOtpLimiter/);
  assert.match(server, /timingSafeEqual/);
  assert.match(server, /NODE_ENV==='production'&&!emailTransport/);
});
test('email verification redirects back to the served app rather than an external localhost port', () => {
  assert.match(read('server/server.js'), /OTP-based email verification/);
  assert.match(read('server/.env.example'), /APP_BASE_URL=http:\/\/localhost:3000/);
});
test('four counter categories are preserved', () => {
  const s = read('js/data.js');
  for (const id of ['C1','C2','C3','C4']) assert.match(s, new RegExp(id + ': \\{'));
});

test('admin staff access is server-protected and supports approval/revocation', () => {
 const server=read('server/server.js');
 assert.match(server,/api\/admin\/staff-access\/approve/);
 assert.match(server,/roles\('admin'\)/);
 assert.match(server,/api\/admin\/staff-access\/:userId\/revoke/);
 assert.match(read('admin/staff-access.html'),/Approve as Staff/);
});
test('checkout uses a no-charge demo payment and server accepts it', () => {
 assert.match(read('student/checkout.html'),/Demo payment · no charge/);
 assert.match(read('server/server.js'),/enum:\['pay-at-counter','online','demo'\]/);
 assert.match(read('server/server.js'),/paymentMethod==='demo'\?'demo'/);
});
