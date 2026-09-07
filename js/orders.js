/* ==========================================================================
   QueueLess — order state machine (Supabase-backed)
   Status flow: received -> accepted -> preparing -> ready -> collected
   ========================================================================== */
import { supabase } from './supabase.js';
import { QL_CAPACITY } from './data.js';

export const QL_STATUS_LABEL = {
  received: 'Order Received',
  accepted: 'Order Accepted',
  preparing: 'Preparing',
  ready: 'Ready for Pickup',
  collected: 'Collected',
  cancelled: 'Cancelled',
};

export const QL_ACTIVE_STATUSES = ['received', 'accepted', 'preparing'];

// Row (snake_case) -> UI shape (camelCase).
function normalizeOrder(row) {
  return {
    id: row.id,
    token: row.token,
    userId: row.user_id,
    studentName: row.student_name,
    items: row.items || [],
    status: row.status,
    subtotal: row.subtotal,
    prepTime: row.prep_time,
    pickupTime: row.pickup_time,
    paymentMethod: row.payment_method,
    history: row.history || [],
    createdAt: new Date(row.created_at).getTime(),
  };
}

export function qlEstimatePrepTime(cartItems) {
  // cartItems carry their own prepTime snapshot.
  let total = 0;
  cartItems.forEach(ci => { total += (ci.prepTime || 0); });
  return Math.max(5, Math.min(25, total));
}

// --- Reads -----------------------------------------------------------------
export async function qlGetOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) { console.error('qlGetOrders', error); return []; }
  return data.map(normalizeOrder);
}

export async function qlGetMyOrders() {
  const { data: sess } = await supabase.auth.getSession();
  if (!sess.session) return [];
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', sess.session.user.id)
    .order('created_at', { ascending: false });
  if (error) { console.error('qlGetMyOrders', error); return []; }
  return data.map(normalizeOrder);
}

export async function qlGetOrder(orderId) {
  const { data, error } = await supabase.from('orders').select('*').eq('id', orderId).single();
  if (error) { console.error('qlGetOrder', error); return null; }
  return normalizeOrder(data);
}

export async function qlLatestActiveOrder() {
  const { data: sess } = await supabase.auth.getSession();
  if (!sess.session) return null;
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', sess.session.user.id)
    .neq('status', 'collected')
    .neq('status', 'cancelled')
    .order('created_at', { ascending: false })
    .limit(1);
  if (error || !data.length) return null;
  return normalizeOrder(data[0]);
}

// Number of active orders strictly ahead of this one (queue position).
export async function qlQueuePosition(orderId) {
  const { data, error } = await supabase
    .from('orders')
    .select('id, created_at, status')
    .in('status', QL_ACTIVE_STATUSES)
    .order('created_at', { ascending: true });
  if (error || !data) return 0;
  const idx = data.findIndex(o => o.id === orderId);
  return idx < 0 ? 0 : idx;
}

export async function qlKitchenWorkload() {
  const { count, error } = await supabase
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .in('status', QL_ACTIVE_STATUSES);
  const active = error ? 0 : (count || 0);
  const pct = Math.min(100, Math.round((active / QL_CAPACITY) * 100));
  return { active, capacity: QL_CAPACITY, pct };
}

// --- Writes ----------------------------------------------------------------
export async function qlCreateOrder({ items, pickupTime, paymentMethod }) {
  const { data: sess } = await supabase.auth.getSession();
  if (!sess.session) throw new Error('Not signed in');

  const subtotal = items.reduce((s, ci) => s + ci.price * ci.qty, 0);
  const prep = qlEstimatePrepTime(items);
  const now = new Date().toISOString();

  const { data, error } = await supabase.from('orders').insert({
    user_id: sess.session.user.id,
    student_name: sess.session.user.user_metadata?.name ||
      (sess.session.user.email || 'Student').split('@')[0],
    items: items.map(ci => ({
      id: ci.id, name: ci.name, price: ci.price, qty: ci.qty, instructions: ci.instructions || '',
    })),
    status: 'received',
    subtotal,
    prep_time: prep,
    pickup_time: pickupTime,
    payment_method: paymentMethod,
    history: [{ status: 'received', at: now }],
  }).select().single();

  if (error) throw error;
  return normalizeOrder(data);
}

export async function qlAdvanceOrder(orderId, newStatus) {
  const current = await qlGetOrder(orderId);
  if (!current) return null;
  const history = [...(current.history || []), { status: newStatus, at: new Date().toISOString() }];
  const { data, error } = await supabase
    .from('orders')
    .update({ status: newStatus, history })
    .eq('id', orderId)
    .select()
    .single();
  if (error) throw error;
  return normalizeOrder(data);
}

// Subscribe to live order changes (kitchen board / track page).
export function qlSubscribeOrders(onChange) {
  const channel = supabase
    .channel('orders-live')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, onChange)
    .subscribe();
  return () => supabase.removeChannel(channel);
}

export function qlOrderItemsText(order) {
  return order.items.map(ci => `${ci.name || 'Item'} × ${ci.qty}`).join('\n');
}
