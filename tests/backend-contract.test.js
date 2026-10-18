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
  assert.match(read('server/.env.example'), /aryamenon1330@gmail\.com/);
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
test('email verification redirects back to the served app rather than an external localhost port', () => {
  assert.match(read('server/server.js'), /APP_BASE_URL.*login\.html\?verified=1/);
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
