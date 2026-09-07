/* ==========================================================================
   QueueLess — menu rendering (student-facing)
   Category header images + text-only item cards.
   ========================================================================== */
import { qlIcons, qlToast } from './app.js';
import { qlAddToCart } from './cart.js';
import { qlCategoryImage } from './data.js';

// A single text card (no per-item photo).
export function qlFoodCardHTML(item, opts = {}) {
  const compact = opts.compact;
  return `
  <div class="food-card" data-id="${item.id}">
    <a href="/student/food.html?id=${item.id}" class="food-card-body">
      <div class="flex between" style="align-items:flex-start;">
        <h4 class="food-card-name">${item.name}</h4>
        <span class="food-card-price">₹${item.price}</span>
      </div>
      <div class="food-card-meta">
        <span><i data-lucide="clock" style="width:12px;height:12px;"></i> ~${item.prepTime} min</span>
        <span class="dot-sep">•</span>
        <span class="${item.available ? 'avail-yes' : 'avail-no'}">${item.available ? 'Available' : 'Out of stock'}</span>
      </div>
    </a>
    ${!compact ? `<div class="food-card-foot">
      <button class="btn btn-primary btn-sm btn-block add-btn" ${!item.available ? 'disabled' : ''} data-id="${item.id}">
        ${item.available ? 'Add to Cart' : 'Unavailable'}
      </button>
    </div>` : ''}
  </div>`;
}

// Flat grid of cards (used for "popular" and search results).
export function qlRenderMenuGrid(container, items) {
  if (!items.length) {
    container.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">
      <i data-lucide="search-x"></i>
      <p>No items match your filters.</p>
    </div>`;
  } else {
    container.innerHTML = items.map(i => qlFoodCardHTML(i)).join('');
  }
  wireAddButtons(container, items);
}

// Grouped-by-category layout with a header image per section.
export function qlRenderMenuByCategory(container, items) {
  if (!items.length) {
    container.innerHTML = `<div class="empty-state">
      <i data-lucide="search-x"></i>
      <p>No items match your filters.</p>
    </div>`;
    qlIcons();
    return;
  }

  const groups = {};
  items.forEach(i => { (groups[i.category] ||= []).push(i); });

  container.innerHTML = Object.keys(groups).map(cat => `
    <section class="menu-cat" id="cat-${slug(cat)}">
      <div class="menu-cat-banner" style="background-image:url('${qlCategoryImage(cat)}')">
        <div class="menu-cat-banner-overlay"></div>
        <h2>${cat}</h2>
        <span class="menu-cat-count">${groups[cat].length} items</span>
      </div>
      <div class="grid grid-3 menu-cat-grid">
        ${groups[cat].map(i => qlFoodCardHTML(i)).join('')}
      </div>
    </section>
  `).join('');

  wireAddButtons(container, items);
}

function wireAddButtons(container, items) {
  qlIcons();
  container.querySelectorAll('.add-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const item = items.find(i => i.id === btn.dataset.id);
      if (!item) return;
      qlAddToCart(item, 1);
      qlToast('Added to cart');
    });
  });
}

function slug(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-'); }

export function qlFilterMenu(allItems, { query = '', category = 'All', vegOnly = false, sort = 'popular' }) {
  let items = allItems.slice();
  if (query) {
    const q = query.toLowerCase();
    items = items.filter(i => i.name.toLowerCase().includes(q));
  }
  if (category && category !== 'All') items = items.filter(i => i.category === category);
  if (vegOnly) items = items.filter(i => i.veg);

  if (sort === 'price-asc') items.sort((a, b) => a.price - b.price);
  else if (sort === 'price-desc') items.sort((a, b) => b.price - a.price);
  else if (sort === 'prep-asc') items.sort((a, b) => a.prepTime - b.prepTime);
  else if (sort === 'popular') items.sort((a, b) => (b.popular ? 1 : 0) - (a.popular ? 1 : 0));
  return items;
}
