/* ==========================================================================
   QueueLess — shared app utilities
   ========================================================================== */
import { createIcons, icons } from 'lucide';
import { qlGetCart } from './data.js';

export function qlToast(msg) {
  let host = document.getElementById('toast-host');
  if (!host) {
    host = document.createElement('div');
    host.id = 'toast-host';
    document.body.appendChild(host);
  }
  const t = document.createElement('div');
  t.className = 'toast';
  t.innerHTML = `<span class="dot"></span>${msg}`;
  host.appendChild(t);
  setTimeout(() => { t.style.transition = 'opacity .3s ease'; t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 2600);
}

export function qlIcons() {
  createIcons({ icons });
}

export function qlFormatTime(date) {
  return date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
}

export function qlAddMinutes(date, mins) {
  return new Date(date.getTime() + mins * 60000);
}

export function qlCartCount() {
  return qlGetCart().reduce((sum, i) => sum + i.qty, 0);
}

export function qlUpdateCartBadge() {
  document.querySelectorAll('.cart-count').forEach(el => {
    const n = qlCartCount();
    el.textContent = n;
    el.style.display = n > 0 ? 'flex' : 'none';
  });
}

// highlight active nav link based on current page filename
export function qlSetActiveNav() {
  const path = window.location.pathname.split('/').pop();
  document.querySelectorAll('.nav-links a, .dash-nav a').forEach(a => {
    const href = (a.getAttribute('href') || '').split('/').pop();
    if (href && href === path) a.classList.add('active');
  });
}

// Run shared init on every page that imports this module.
document.addEventListener('DOMContentLoaded', () => {
  qlIcons();
  qlUpdateCartBadge();
  qlSetActiveNav();
});
