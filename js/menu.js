/* ==========================================================================
   QueueLess — menu rendering (student-facing)
   ========================================================================== */

function qlFoodCardHTML(item, opts={}){
  const compact = opts.compact;
  return `
  <div class="food-card" data-id="${item.id}">
    <a href="food.html?id=${item.id}" class="food-card-img-link">
      <div class="food-card-img" style="background-image:url('${qlGetItemImage(item)}')">
        ${!item.available ? '<span class="food-unavail-badge">Unavailable</span>' : ''}
      </div>
    </a>
    <div class="food-card-body">
      <div class="flex between" style="align-items:flex-start;">
        <a href="food.html?id=${item.id}"><h4 class="food-card-name">${item.name}</h4></a>
        <span class="food-card-price">₹${item.price}</span>
      </div>
      <div class="food-card-meta">
        <span><i data-lucide="clock" style="width:12px;height:12px;"></i> ~${item.prepTimeMinutes} min</span>
        <span class="dot-sep">•</span>
        <span class="${item.available?'avail-yes':'avail-no'}">${item.available ? 'Available' : 'Out of stock'}</span>
      </div>
      ${!compact ? `<button class="btn btn-primary btn-sm btn-block mt-8 add-btn" ${!item.available?'disabled':''} data-id="${item.id}">
        ${item.available ? 'Add to Cart' : 'Unavailable'}
      </button>` : ''}
    </div>
  </div>`;
}

function qlRenderMenuGrid(container, items){
  if(items.length === 0){
    container.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">
      <i data-lucide="search-x"></i>
      <p>No items match your filters.</p>
    </div>`;
  } else {
    container.innerHTML = items.map(i=>qlFoodCardHTML(i)).join('');
  }
  qlIcons();
  container.querySelectorAll('.add-btn').forEach(btn=>{
    btn.addEventListener('click', (e)=>{
      e.preventDefault();
      qlAddToCart(btn.dataset.id, 1);
      qlToast(`Added to cart`);
    });
  });
}

const QL_BROWSE_GROUPS = {
  'Snacks': ['Snacks','Fast Items','Chaat Items'],
  'Packaged Snacks': ['Packaged Snacks'],
  'Meals': ['Lunch Items','Rice Items','Special Rice','Gravy Items'],
  'Soups': ['Soup'],
  'Beverages': ['Hot Items'],
  'Dosas & Uttappa': ['Dosa Items','Special Uttappa'],
  'Sandwiches': ['Sandwiches Item','Grilled Sandwich'],
  'Chinese': ['Noodles','Choupsey'],
  'Juices': ['Juices'],
  'Frankie Counter': ['Frankie Counter'],
  'Desserts': ['Desserts']
};

function qlCategoriesForGroup(group){ return QL_BROWSE_GROUPS[group] || []; }


function qlRenderMenuList(container, items){
  if(items.length === 0){
    container.innerHTML = `<div class="empty-state"><i data-lucide="search-x"></i><p>No items match your filters.</p></div>`;
  } else {
    container.innerHTML = items.map(item=>`
      <div class="menu-list-row" data-id="${item.id}">
        <div class="menu-list-main">
          <div>
            <h4>${item.name}</h4>
            <div class="menu-list-meta"><span>${item.category}</span><span>•</span><span>~${item.prepTimeMinutes} min</span></div>
          </div>
        </div>
        <div class="menu-list-action"><strong>₹${item.price}</strong><button class="btn btn-primary btn-sm add-btn" ${!item.available?'disabled':''} data-id="${item.id}">${item.available?'Add to Cart':'Unavailable'}</button></div>
      </div>`).join('');
  }
  qlIcons();
  container.querySelectorAll('.add-btn').forEach(btn=>btn.addEventListener('click',()=>{ qlAddToCart(btn.dataset.id,1); qlToast('Added to cart'); }));
}

function qlFilterMenu({ query='', category='All', group='', sort='popular' }){
  let items = qlGetMenu();
  if(query){
    const q = query.toLowerCase();
    items = items.filter(i=>i.name.toLowerCase().includes(q));
  }
  if(category && category !== 'All'){
    items = items.filter(i=>i.category === category);
  }
  if(group){
    const cats = qlCategoriesForGroup(group);
    items = items.filter(i=>cats.includes(i.category));
  }
  if(sort === 'price-asc') items = items.slice().sort((a,b)=>a.price-b.price);
  if(sort === 'price-desc') items = items.slice().sort((a,b)=>b.price-a.price);
  if(sort === 'prep-asc') items = items.slice().sort((a,b)=>a.prepTimeMinutes-b.prepTimeMinutes);
  if(sort === 'popular') items = items.slice().sort((a,b)=>(b.popular?1:0)-(a.popular?1:0));
  return items;
}
