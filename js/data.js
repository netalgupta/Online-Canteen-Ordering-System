/* ==========================================================================
   QueueLess — data layer (Supabase-backed menu, local cart)
   ========================================================================== */
import { supabase } from './supabase.js';

export const QL_CAPACITY = 15; // max orders the kitchen can actively work at once
export const QL_LOCATIONS_TEXT = 'Main College Canteen';

// Per-category header image for the student menu (category tiles only).
export const QL_CATEGORY_IMAGES = {
  'HOT ITEMS': 'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=600&q=80',
  'SNACKS': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&q=80',
  'FAST ITEMS': 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=600&q=80',
  'DOSA ITEMS': 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&q=80',
  'SPECIAL UTTAPPA': 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=600&q=80',
  'SANDWICHES': 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&q=80',
  'GRILLED SANDWICH': 'https://images.unsplash.com/photo-1554433607-66b5efe9d304?w=600&q=80',
  'CHAT ITEMS': 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=600&q=80',
  'NOODLES': 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=600&q=80',
  'RICE ITEMS': 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&q=80',
  'SPECIAL RICE': 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=600&q=80',
  'GRAVY ITEMS': 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&q=80',
  'CHOUPSEY': 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600&q=80',
  'SOUP & EXTRAS': 'https://images.unsplash.com/photo-1547592180-85f173990554?w=600&q=80',
  'LUNCH ITEMS': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&q=80',
};

export function qlCategoryImage(category) {
  return QL_CATEGORY_IMAGES[category] ||
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80';
}

// --- Menu (Supabase) -------------------------------------------------------
// Rows come back snake_case; normalize to the camelCase shape the UI expects.
function normalizeItem(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    price: row.price,
    prepTime: row.prep_time,
    veg: row.veg,
    available: row.available,
    popular: row.popular,
    sortOrder: row.sort_order,
  };
}

export async function qlGetMenu() {
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .order('category', { ascending: true })
    .order('sort_order', { ascending: true });
  if (error) { console.error('qlGetMenu', error); return []; }
  return data.map(normalizeItem);
}

export async function qlGetMenuItem(id) {
  const { data, error } = await supabase.from('menu_items').select('*').eq('id', id).single();
  if (error) { console.error('qlGetMenuItem', error); return null; }
  return normalizeItem(data);
}

export async function qlUpdateMenuItem(id, patch) {
  // patch uses camelCase; map to columns.
  const col = {};
  if ('available' in patch) col.available = patch.available;
  if ('price' in patch) col.price = patch.price;
  if ('prepTime' in patch) col.prep_time = patch.prepTime;
  if ('popular' in patch) col.popular = patch.popular;
  if ('name' in patch) col.name = patch.name;
  if ('category' in patch) col.category = patch.category;
  if ('veg' in patch) col.veg = patch.veg;
  const { error } = await supabase.from('menu_items').update(col).eq('id', id);
  if (error) throw error;
}

export async function qlAddMenuItem(item) {
  const { data, error } = await supabase.from('menu_items').insert({
    name: item.name,
    category: item.category,
    price: item.price,
    prep_time: item.prepTime,
    veg: item.veg ?? true,
    available: item.available ?? true,
    popular: item.popular ?? false,
    sort_order: item.sortOrder ?? 999,
  }).select().single();
  if (error) throw error;
  return normalizeItem(data);
}

export async function qlDeleteMenuItem(id) {
  const { error } = await supabase.from('menu_items').delete().eq('id', id);
  if (error) throw error;
}

// --- Cart (local, per-device) ----------------------------------------------
export function qlGetCart() { return JSON.parse(localStorage.getItem('ql_cart') || '[]'); }
export function qlSaveCart(cart) { localStorage.setItem('ql_cart', JSON.stringify(cart)); }
