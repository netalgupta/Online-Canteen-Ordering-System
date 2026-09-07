/* ==========================================================================
   QueueLess — cart operations (local storage)
   Each line stores a snapshot { id, name, price, prepTime, qty, instructions }
   so cart/checkout pages don't need to refetch the whole menu.
   ========================================================================== */
import { qlGetCart, qlSaveCart } from './data.js';
import { qlUpdateCartBadge } from './app.js';

export function qlAddToCart(item, qty = 1, instructions = '') {
  const cart = qlGetCart();
  const existing = cart.find(c => c.id === item.id && c.instructions === instructions);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({
      id: item.id,
      name: item.name,
      price: item.price,
      prepTime: item.prepTime,
      qty,
      instructions,
    });
  }
  qlSaveCart(cart);
  qlUpdateCartBadge();
}

export function qlSetCartQty(itemId, qty) {
  let cart = qlGetCart();
  if (qty <= 0) {
    cart = cart.filter(c => c.id !== itemId);
  } else {
    const existing = cart.find(c => c.id === itemId);
    if (existing) existing.qty = qty;
  }
  qlSaveCart(cart);
  qlUpdateCartBadge();
}

export function qlRemoveFromCart(itemId) {
  const cart = qlGetCart().filter(c => c.id !== itemId);
  qlSaveCart(cart);
  qlUpdateCartBadge();
}

export function qlCartSubtotal() {
  return qlGetCart().reduce((sum, ci) => sum + ci.price * ci.qty, 0);
}

export function qlClearCart() {
  qlSaveCart([]);
  qlUpdateCartBadge();
}
