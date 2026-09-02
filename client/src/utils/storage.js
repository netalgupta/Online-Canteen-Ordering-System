export const saveToken = (t) => localStorage.setItem('canteen_token', t);
export const getToken = () => localStorage.getItem('canteen_token');
export const removeToken = () => localStorage.removeItem('canteen_token');

export const saveUser = (u) => localStorage.setItem('canteen_user', JSON.stringify(u));
export const getUser = () => { 
  try { return JSON.parse(localStorage.getItem('canteen_user')); } 
  catch { return null; } 
};
export const removeUser = () => localStorage.removeItem('canteen_user');

export const saveCart = (c) => localStorage.setItem('canteen_cart', JSON.stringify(c));
export const getCart = () => { 
  try { return JSON.parse(localStorage.getItem('canteen_cart')) || []; } 
  catch { return []; } 
};
export const clearCartStorage = () => localStorage.removeItem('canteen_cart');

export const saveIdempotencyKey = (k) => localStorage.setItem('canteen_idem_key', k);
export const getIdempotencyKey = () => localStorage.getItem('canteen_idem_key');
export const clearIdempotencyKey = () => localStorage.removeItem('canteen_idem_key');
