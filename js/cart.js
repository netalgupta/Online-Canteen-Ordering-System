/* ==========================================================================
   QueueLess — cart operations
   ========================================================================== */

function qlAddToCart(itemId, qty=1, instructions=''){
  const cart = qlGetCart();
  const existing = cart.find(c=>c.id===itemId && c.instructions===instructions);
  if(existing){
    existing.qty += qty;
  } else {
    cart.push({ id:itemId, qty, instructions });
  }
  qlSaveCart(cart);
  qlUpdateCartBadge();
}

function qlSetCartQty(itemId, qty){
  let cart = qlGetCart();
  if(qty <= 0){
    cart = cart.filter(c=>c.id!==itemId);
  } else {
    const existing = cart.find(c=>c.id===itemId);
    if(existing) existing.qty = qty;
  }
  qlSaveCart(cart);
  qlUpdateCartBadge();
}

function qlRemoveFromCart(itemId){
  const cart = qlGetCart().filter(c=>c.id!==itemId);
  qlSaveCart(cart);
  qlUpdateCartBadge();
}

function qlCartSubtotal(){
  const menu = qlGetMenu();
  return qlGetCart().reduce((sum,ci)=>{
    const m = menu.find(x=>x.id===ci.id);
    return sum + (m ? m.price*ci.qty : 0);
  },0);
}

function qlClearCart(){
  qlSaveCart([]);
  qlUpdateCartBadge();
}
