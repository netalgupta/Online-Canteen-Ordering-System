import dotenv from 'dotenv';
import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { rateLimit } from 'express-rate-limit';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getPasswordPolicyError, isSomaiyaEmail } from './src/utils/authValidation.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.error('Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY in server/.env.');
  process.exit(1);
}

const app = express();
const port = Number(process.env.PORT || 3000);
const authClient = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false }
});
function publicAuthClient() {
  return createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false }
  });
}
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: 'draft-8', legacyHeaders: false,
  message: { error: 'Too many authentication attempts. Try again later.' }
});
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, limit: 8, standardHeaders: 'draft-8', legacyHeaders: false,
  message: { error: 'Too many verification attempts. Try again later.' }
});
const resendOtpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, limit: 3, standardHeaders: 'draft-8', legacyHeaders: false,
  message: { error: 'Too many verification codes requested. Try again later.' }
});

app.use(express.json({ limit: '1mb' }));

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function sendError(res, error, fallback) {
  if (error instanceof HttpError) return res.status(error.status).json({ error: error.message });
  const message = String(error?.message || error || '');
  const knownErrors = {
    PICKUP_SLOT_FULL: [409, 'This pickup slot is full. Choose another slot.'],
    INVALID_PICKUP_SLOT: [400, 'Choose a valid 7-minute pickup slot.'],
    OUTSIDE_BUSINESS_HOURS: [400, 'Pickup slots must be between 6:00 AM and 7:00 PM.'],
    EMPTY_ORDER: [400, 'Cart is empty.'],
    TOO_MANY_LINES: [400, 'An order can contain at most 30 different items.'],
    INVALID_QUANTITY: [400, 'Item quantities must be between 1 and 99.'],
    MENU_ITEM_UNAVAILABLE: [409, 'One or more menu items are unavailable. Refresh the menu.'],
    STAFF_COUNTER_REQUIRED: [400, 'Assign a counter to staff accounts.'],
    INVALID_ROLE: [400, 'Choose a valid account role.'],
    PROFILE_NOT_FOUND: [404, 'Account not found.']
  };
  const match = Object.entries(knownErrors).find(([key]) => message.includes(key));
  if (match) return res.status(match[1][0]).json({ error: match[1][1] });
  if (error?.code === '42501') return res.status(403).json({ error: 'You do not have permission for this action.' });
  console.error(fallback, error);
  return res.status(500).json({ error: fallback });
}

function asyncRoute(handler, fallback = 'The request could not be completed.') {
  return (req, res, next) =>
    Promise.resolve(handler(req, res, next)).catch(error => sendError(res, error, fallback));
}

function userClient(accessToken) {
  return createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } }
  });
}

function readBearerToken(req) {
  const match = /^Bearer\s+(.+)$/i.exec(req.get('authorization') || '');
  return match?.[1] || null;
}

async function authenticate(req, { optional = false } = {}) {
  const token = readBearerToken(req);
  if (!token) {
    if (optional) return null;
    throw new HttpError(401, 'Please sign in again.');
  }
  const { data, error } = await authClient.auth.getUser(token);
  if (error || !data.user) throw new HttpError(401, 'Please sign in again.');
  if (!isSomaiyaEmail(data.user.email || '')) throw new HttpError(403, 'Use an account ending in @somaiya.edu.');

  const db = userClient(token);
  const { data: profile, error: profileError } = await db
    .from('ql_profiles')
    .select('user_id,full_name,phone,roll_number,role,counter_id')
    .eq('user_id', data.user.id)
    .single();
  if (profileError || !profile) throw new HttpError(403, 'Your QueueLess profile is unavailable.');

  req.auth = data.user;
  req.profile = profile;
  req.db = db;
  return data.user;
}

const auth = asyncRoute(async (req, _res, next) => {
  await authenticate(req);
  next();
}, 'Could not verify your session.');

function roles(...allowed) {
  return asyncRoute(async (req, res, next) => {
    await authenticate(req);
    if (!allowed.includes(req.profile.role)) {
      throw new HttpError(403, 'You do not have permission for this action.');
    }
    next();
  }, 'Could not verify your access.');
}

function requireSomaiyaEmail(value) {
  const email = String(value || '').trim().toLowerCase();
  if (!isSomaiyaEmail(email)) {
    throw new HttpError(400, 'Use your college email ending in @somaiya.edu.');
  }
  return email;
}

function mapUser(user, profile) {
  return {
    id: user.id,
    name: profile.full_name,
    email: user.email,
    role: profile.role,
    counterId: profile.counter_id,
    verified: Boolean(user.email_confirmed_at || user.confirmed_at)
  };
}

function mapMenuItem(item) {
  return {
    itemId: item.id,
    id: item.id,
    name: item.name,
    category: item.category,
    price: item.price,
    prepTimeMinutes: item.prep_time_minutes,
    veg: item.veg,
    available: item.available,
    popular: item.popular,
    description: item.description || '',
    image: item.image_url || ''
  };
}

function mapOrder(order, customerEmail = '') {
  return {
    _id: order.id,
    id: order.id,
    orderNumber: order.order_number,
    userId: order.user_id,
    pickupSlot: order.pickup_slot,
    paymentMethod: order.payment_method,
    status: order.status,
    total: order.total,
    customerName: order.customer_name,
    customerEmail,
    instructions: order.instructions || '',
    createdAt: order.created_at,
    items: (order.items || []).map(item => ({
      _id: item.id,
      id: item.id,
      menuItemId: item.menu_item_id,
      name: item.item_name,
      quantity: item.quantity,
      price: item.unit_price,
      counterId: item.counter_id,
      status: item.status,
      instructions: item.instructions || '',
      prepTimeMinutes: item.prep_time_minutes,
      readyAt: item.estimated_ready_at
    }))
  };
}

const orderSelect = 'id,order_number,user_id,pickup_slot,payment_method,status,total,customer_name,instructions,created_at,items:ql_order_items(id,menu_item_id,item_name,quantity,unit_price,counter_id,status,instructions,prep_time_minutes,estimated_ready_at)';

function validateProfileName(value) {
  const name = String(value || '').trim();
  if (name.length < 2 || name.length > 100) {
    throw new HttpError(400, 'Name must be 2–100 characters.');
  }
  return name;
}

function validateCounter(value) {
  const counter = String(value || '');
  if (!['C1', 'C2', 'C3', 'C4'].includes(counter)) {
    throw new HttpError(400, 'Choose a valid counter.');
  }
  return counter;
}

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'QueueLess Supabase API' }));

app.post('/api/auth/register', authLimiter, asyncRoute(async (req, res) => {
  const name = validateProfileName(req.body?.name);
  const email = requireSomaiyaEmail(req.body?.email);
  const password = String(req.body?.password || '');
  const passwordError = getPasswordPolicyError(password);
  if (passwordError) throw new HttpError(400, passwordError);
  const requestedRole = String(req.body?.requestedRole || 'student');
  if (!['student', 'staff', 'admin'].includes(requestedRole)) {
    throw new HttpError(400, 'Choose a valid account role.');
  }
  const requestedCounter = req.body?.requestedCounter
    ? validateCounter(req.body.requestedCounter)
    : null;
  const rollNumber = String(req.body?.rollNumber || '').trim().slice(0, 40);
  const { data, error } = await publicAuthClient().auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.APP_BASE_URL || 'http://localhost:3000'}/login.html?verified=1`,
      data: {
        full_name: name,
        roll_number: rollNumber,
        requested_role: requestedRole,
        requested_counter: requestedCounter
      }
    }
  });
  if (error) throw new HttpError(error.status === 422 ? 409 : 400, error.message);
  res.status(201).json({
    message: 'Account created. Check your Somaiya email for a verification code.',
    email,
    verificationRequired: !data.session
  });
}, 'Could not create account.'));

app.post('/api/auth/verify-otp', otpLimiter, asyncRoute(async (req, res) => {
  const email = requireSomaiyaEmail(req.body?.email);
  const token = String(req.body?.otp || '').trim().replace(/\s/g, '');
  if (!/^\d{6}$/.test(token)) throw new HttpError(400, 'Enter the 6-digit verification code.');
  const { error } = await publicAuthClient().auth.verifyOtp({ email, token, type: 'email' });
  if (error) throw new HttpError(400, error.message);
  res.json({ ok: true, message: 'Email verified! You can now sign in.' });
}, 'Could not verify code.'));

app.post('/api/auth/resend-otp', resendOtpLimiter, asyncRoute(async (req, res) => {
  const email = requireSomaiyaEmail(req.body?.email);
  const { error } = await publicAuthClient().auth.resend({ type: 'signup', email });
  if (error) throw new HttpError(400, error.message);
  res.json({ message: 'If the account exists and is unverified, a new code has been sent.' });
}, 'Could not resend code.'));

app.post('/api/auth/login', authLimiter, asyncRoute(async (req, res) => {
  const email = requireSomaiyaEmail(req.body?.email);
  const password = String(req.body?.password || '');
  const { data, error } = await publicAuthClient().auth.signInWithPassword({ email, password });
  if (error) {
    const unverified = /not confirmed|email_not_confirmed/i.test(`${error.code || ''} ${error.message}`);
    if (unverified) {
      return res.status(403).json({
        error: 'Please verify your email before signing in.',
        verificationRequired: true,
        email
      });
    }
    throw new HttpError(error.status === 429 ? 429 : 401, 'Email or password is incorrect.');
  }
  const { data: profile, error: profileError } = await userClient(data.session.access_token)
    .from('ql_profiles')
    .select('user_id,full_name,phone,roll_number,role,counter_id')
    .eq('user_id', data.user.id)
    .single();
  if (profileError || !profile) throw new HttpError(403, 'Your QueueLess profile is unavailable.');
  res.json({
    token: data.session.access_token,
    refreshToken: data.session.refresh_token,
    user: mapUser(data.user, profile)
  });
}, 'Could not sign in.'));

app.post('/api/auth/refresh', authLimiter, asyncRoute(async (req, res) => {
  const refreshToken = String(req.body?.refreshToken || '');
  if (!refreshToken) throw new HttpError(400, 'Your session has expired. Please sign in again.');
  const { data, error } = await publicAuthClient().auth.refreshSession({ refresh_token: refreshToken });
  if (error || !data.session || !data.user) throw new HttpError(401, 'Your session has expired. Please sign in again.');
  if (!isSomaiyaEmail(data.user.email || '')) throw new HttpError(403, 'Use an account ending in @somaiya.edu.');
  const { data: profile, error: profileError } = await userClient(data.session.access_token)
    .from('ql_profiles')
    .select('user_id,full_name,phone,roll_number,role,counter_id')
    .eq('user_id', data.user.id)
    .single();
  if (profileError || !profile) throw new HttpError(403, 'Your QueueLess profile is unavailable.');
  res.json({
    token: data.session.access_token,
    refreshToken: data.session.refresh_token,
    user: mapUser(data.user, profile)
  });
}, 'Could not refresh your session.'));

app.get('/api/auth/me', auth, (req, res) => {
  res.json({ user: mapUser(req.auth, req.profile) });
});

app.post('/api/auth/logout', asyncRoute(async (req, res) => {
  const refreshToken = String(req.body?.refreshToken || '');
  if (refreshToken) {
    const client = publicAuthClient();
    const { error: sessionError } = await client.auth.setSession({
      access_token: readBearerToken(req) || '',
      refresh_token: refreshToken
    });
    if (sessionError) throw new HttpError(401, 'Could not end this session. Please sign in again.');
    const { error } = await client.auth.signOut({ scope: 'local' });
    if (error) throw error;
  }
  res.json({ ok: true });
}, 'Could not end this session.'));

app.patch('/api/auth/profile', auth, asyncRoute(async (req, res) => {
  const updates = {};
  if (req.body?.name !== undefined) updates.full_name = validateProfileName(req.body.name);
  if (req.body?.phone !== undefined) updates.phone = String(req.body.phone).trim().slice(0, 30) || null;
  if (req.body?.rollNumber !== undefined) updates.roll_number = String(req.body.rollNumber).trim().slice(0, 40) || null;
  if (!Object.keys(updates).length) throw new HttpError(400, 'Provide profile details to update.');
  const { data: profile, error } = await req.db.from('ql_profiles')
    .update(updates).eq('user_id', req.auth.id)
    .select('user_id,full_name,phone,roll_number,role,counter_id').single();
  if (error) throw error;
  res.json({ user: mapUser(req.auth, profile) });
}, 'Could not update profile.'));

app.patch('/api/auth/password', auth, authLimiter, asyncRoute(async (req, res) => {
  const currentPassword = String(req.body?.currentPassword || '');
  const newPassword = String(req.body?.newPassword || '');
  const policyError = getPasswordPolicyError(newPassword, 'New password');
  if (policyError) throw new HttpError(400, policyError);
  const { error: currentError } = await publicAuthClient().auth.signInWithPassword({
    email: req.auth.email,
    password: currentPassword
  });
  if (currentError) throw new HttpError(400, 'Current password is incorrect.');
  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    method: 'PUT',
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${readBearerToken(req)}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ password: newPassword })
  });
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new HttpError(400, errorBody.msg || errorBody.message || 'Could not update password.');
  }
  res.json({ ok: true });
}, 'Could not change password.'));

app.get('/api/menu', asyncRoute(async (req, res) => {
  const token = readBearerToken(req);
  let db = authClient;
  if (token) {
    await authenticate(req);
    db = req.db;
  }
  const { data, error } = await db.from('ql_menu_items')
    .select('*').order('category').order('name');
  if (error) throw error;
  res.json({ items: data.map(mapMenuItem) });
}, 'Could not load the menu.'));

app.get('/api/admin/staff-access', roles('admin'), asyncRoute(async (req, res) => {
  const { data, error } = await req.db.rpc('ql_admin_list_profiles', {
    p_requested_role: null,
    p_email: null
  });
  if (error) throw error;
  res.json({
    users: data.map(user => ({
      id: user.user_id,
      name: user.full_name,
      email: user.email,
      role: user.role,
      counterId: user.counter_id,
      requestedRole: user.requested_role,
      requestedCounter: user.requested_counter,
      verified: user.verified,
      createdAt: user.created_at
    }))
  });
}, 'Could not load accounts.'));

app.post('/api/admin/staff-access/approve', roles('admin'), asyncRoute(async (req, res) => {
  const email = requireSomaiyaEmail(req.body?.email);
  const counterId = validateCounter(req.body?.counterId);
  const { data: matches, error: lookupError } = await req.db.rpc('ql_admin_list_profiles', {
    p_requested_role: null,
    p_email: email
  });
  if (lookupError) throw lookupError;
  if (!matches.length) throw new HttpError(404, 'No registered account was found for that email.');
  const { data, error } = await req.db.rpc('ql_admin_update_profile', {
    p_user_id: matches[0].user_id,
    p_role: 'staff',
    p_counter_id: counterId
  });
  if (error) throw error;
  res.json({ message: `${matches[0].full_name} approved as staff.`, user: data });
}, 'Could not approve staff access.'));

app.patch('/api/admin/staff-access/:userId/revoke', roles('admin'), asyncRoute(async (req, res) => {
  const { data, error } = await req.db.rpc('ql_admin_update_profile', {
    p_user_id: req.params.userId,
    p_role: 'student',
    p_counter_id: null
  });
  if (error) throw error;
  res.json({ message: 'Staff access revoked.', user: data });
}, 'Could not revoke staff access.'));

app.put('/api/menu/:itemId', roles('admin'), asyncRoute(async (req, res) => {
  const itemId = String(req.params.itemId || '').trim();
  const body = req.body || {};
  const name = String(body.name || '').trim();
  const category = String(body.category || '').trim();
  const price = Number(body.price);
  const prepTime = Number(body.prepTimeMinutes || 5);
  if (!itemId || !name || !category || !Number.isInteger(price) || price < 0 ||
      !Number.isInteger(prepTime) || prepTime < 1 || prepTime > 180) {
    throw new HttpError(400, 'Provide an item ID, name, category, valid price, and preparation time.');
  }
  const { data, error } = await req.db.rpc('ql_admin_save_menu_item', {
    p_id: itemId,
    p_name: name,
    p_category: category,
    p_price: price,
    p_prep_time_minutes: prepTime,
    p_available: body.available !== false,
    p_popular: Boolean(body.popular),
    p_description: String(body.description || body.desc || '').slice(0, 500),
    p_image_url: String(body.image || '').slice(0, 1000)
  });
  if (error) throw error;
  res.json({ item: mapMenuItem(data) });
}, 'Could not save menu item.'));

app.patch('/api/menu/:itemId', roles('admin', 'staff'), asyncRoute(async (req, res) => {
  const itemId = String(req.params.itemId || '').trim();
  const { data: existing, error: lookupError } = await req.db.from('ql_menu_items')
    .select('*').eq('id', itemId).maybeSingle();
  if (lookupError) throw lookupError;
  if (!existing) throw new HttpError(404, 'Menu item not found.');

  let data;
  let error;
  if (req.profile.role === 'staff') {
    const prepTime = Number(req.body?.prepTimeMinutes ?? existing.prep_time_minutes);
    if (!Number.isInteger(prepTime) || prepTime < 1 || prepTime > 180) {
      throw new HttpError(400, 'Preparation time must be between 1 and 180 minutes.');
    }
    ({ data, error } = await req.db.rpc('ql_staff_update_menu_item', {
      p_id: itemId,
      p_available: req.body?.available === undefined ? existing.available : req.body.available === true,
      p_prep_time_minutes: prepTime
    }));
  } else {
    const body = req.body || {};
    ({ data, error } = await req.db.rpc('ql_admin_save_menu_item', {
      p_id: itemId,
      p_name: String(body.name ?? existing.name).trim(),
      p_category: String(body.category ?? existing.category).trim(),
      p_price: Number(body.price ?? existing.price),
      p_prep_time_minutes: Number(body.prepTimeMinutes ?? existing.prep_time_minutes),
      p_available: body.available === undefined ? existing.available : body.available === true,
      p_popular: body.popular === undefined ? existing.popular : body.popular === true,
      p_description: String(body.description ?? existing.description ?? '').slice(0, 500),
      p_image_url: String(body.image ?? existing.image_url ?? '').slice(0, 1000)
    }));
  }
  if (error) throw error;
  res.json({ item: mapMenuItem(data) });
}, 'Could not update menu item.'));

app.post('/api/orders', roles('student', 'staff', 'admin'), asyncRoute(async (req, res) => {
  if (!Array.isArray(req.body?.items) || req.body.items.length === 0) {
    throw new HttpError(400, 'Cart is empty.');
  }
  const items = req.body.items.map(item => ({
    menuItemId: String(item.id || item.menuItemId || ''),
    quantity: Number(item.qty ?? item.quantity),
    instructions: String(item.instructions || '').slice(0, 250)
  }));
  if (items.some(item => !item.menuItemId || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99)) {
    throw new HttpError(400, 'Check item IDs and quantities in your cart.');
  }
  const pickupSlot = new Date(req.body.pickupSlot);
  if (!Number.isFinite(pickupSlot.getTime()) || pickupSlot.getTime() < Date.now() - 60_000) {
    throw new HttpError(400, 'Choose a valid future pickup slot.');
  }
  const paymentMethod = ['pay-at-counter', 'online', 'demo'].includes(req.body.paymentMethod)
    ? req.body.paymentMethod
    : 'pay-at-counter';
  const { data: createdOrder, error: orderError } = await req.db.rpc('ql_create_order', {
    p_items: items,
    p_pickup_slot: pickupSlot.toISOString(),
    p_payment_method: paymentMethod,
    p_instructions: String(req.body.instructions || '').slice(0, 500)
  });
  if (orderError) throw orderError;
  const { data: order, error } = await req.db.from('ql_orders')
    .select(orderSelect).eq('id', createdOrder.id).eq('user_id', req.auth.id).single();
  if (error) throw error;
  res.status(201).json({ order: mapOrder(order, req.auth.email) });
}, 'Could not create order.'));

app.get('/api/orders/mine', auth, asyncRoute(async (req, res) => {
  const { data, error } = await req.db.from('ql_orders')
    .select(orderSelect).eq('user_id', req.auth.id)
    .order('created_at', { ascending: false }).limit(100);
  if (error) throw error;
  res.json({ orders: data.map(order => mapOrder(order, req.auth.email)) });
}, 'Could not load your orders.'));

app.get('/api/orders/queue', roles('staff', 'admin'), asyncRoute(async (req, res) => {
  const { data, error } = await req.db.from('ql_orders')
    .select(orderSelect).neq('status', 'collected')
    .order('pickup_slot').order('created_at').limit(250);
  if (error) throw error;
  res.json({ orders: data.map(order => mapOrder(order)) });
}, 'Could not load the staff queue.'));

app.patch('/api/orders/:orderId/items/:itemId/status', roles('staff', 'admin'), asyncRoute(async (req, res) => {
  const { data: item, error: lookupError } = await req.db.from('ql_order_items')
    .select('id,order_id').eq('id', req.params.itemId).maybeSingle();
  if (lookupError) throw lookupError;
  if (!item || item.order_id !== req.params.orderId) throw new HttpError(404, 'Order item not found.');
  const { error } = await req.db.rpc('ql_update_item_status', {
    p_order_item_id: req.params.itemId,
    p_new_status: String(req.body?.status || '')
  });
  if (error) throw error;
  res.json({ ok: true });
}, 'Could not update order status.'));

app.get('/login', (_req, res) => res.redirect(302, '/login.html'));
app.get('/register', (_req, res) => res.redirect(302, '/register.html'));
app.use(express.static(path.resolve(__dirname, '..')));

app.listen(port, () => {
  console.log(`QueueLess running at http://localhost:${port}`);
});
