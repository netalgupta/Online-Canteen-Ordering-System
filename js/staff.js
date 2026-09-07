/* ==========================================================================
   QueueLess — staff dashboard logic
   ========================================================================== */

const QL_ACTION_LABEL = {
  received: { next:'accepted', label:'Accept' },
  accepted: { next:'preparing', label:'Start Preparing' },
  preparing: { next:'ready', label:'Mark Ready' },
  ready: { next:'collected', label:'Mark Collected' }
};

function qlOrderCardHTML(order){
  const menu = qlGetMenu();
  const itemsText = order.items.map(ci=>{
    const m = menu.find(x=>x.id===ci.id);
    return `${m?m.name:'Item'} × ${ci.qty}`;
  }).join('<br>');
  const note = order.items.find(ci=>ci.instructions);
  const action = QL_ACTION_LABEL[order.status];
  return `
  <div class="order-card" data-id="${order.id}">
    <div class="order-card-head">
      <span class="order-card-id">#${order.id}</span>
      <span class="pill pill-muted">Token ${order.token}</span>
    </div>
    <div class="order-card-items">${itemsText}</div>
    <div class="order-card-meta">
      <span>${order.studentName}</span>
      <span>Pickup ${order.pickupTime}</span>
    </div>
    ${note ? `<div class="order-card-note">Note: ${note.instructions}</div>` : ''}
    ${action ? `<button class="btn btn-amber btn-sm btn-block advance-btn" data-id="${order.id}" data-next="${action.next}">${action.label}</button>` : ''}
  </div>`;
}

function qlRenderKanban(){
  const orders = qlGetOrders();
  const cols = {
    received: orders.filter(o=>o.status==='received'),
    inprogress: orders.filter(o=>o.status==='accepted' || o.status==='preparing'),
    ready: orders.filter(o=>o.status==='ready')
  };

  const newCol = document.getElementById('col-new');
  const prepCol = document.getElementById('col-preparing');
  const readyCol = document.getElementById('col-ready');

  document.getElementById('count-new').textContent = cols.received.length;
  document.getElementById('count-preparing').textContent = cols.inprogress.length;
  document.getElementById('count-ready').textContent = cols.ready.length;

  newCol.innerHTML = cols.received.length ? cols.received.map(qlOrderCardHTML).join('') : `<p class="text-sm muted" style="padding:10px;">No new orders</p>`;
  prepCol.innerHTML = cols.inprogress.length ? cols.inprogress.map(qlOrderCardHTML).join('') : `<p class="text-sm muted" style="padding:10px;">Nothing in progress</p>`;
  readyCol.innerHTML = cols.ready.length ? cols.ready.map(qlOrderCardHTML).join('') : `<p class="text-sm muted" style="padding:10px;">Nothing ready yet</p>`;

  document.querySelectorAll('.advance-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      qlAdvanceOrder(btn.dataset.id, btn.dataset.next);
      qlToast(`Order #${btn.dataset.id} → ${QL_STATUS_LABEL[btn.dataset.next]}`);
      qlRenderKanban();
      qlRenderStats();
    });
  });
  qlIcons();
}

function qlRenderStats(){
  const orders = qlGetOrders();
  const today = new Date().toDateString();
  const todays = orders.filter(o=> new Date(o.createdAt).toDateString() === today);
  const pending = orders.filter(o=>o.status==='received').length;
  const preparing = orders.filter(o=>o.status==='accepted' || o.status==='preparing').length;
  const ready = orders.filter(o=>o.status==='ready').length;
  const completed = orders.filter(o=>o.status==='collected').length + 94; // seeded baseline for "today" realism

  const els = {
    pending: document.getElementById('stat-pending'),
    preparing: document.getElementById('stat-preparing'),
    ready: document.getElementById('stat-ready'),
    completed: document.getElementById('stat-completed')
  };
  if(els.pending) els.pending.textContent = pending;
  if(els.preparing) els.preparing.textContent = preparing;
  if(els.ready) els.ready.textContent = ready;
  if(els.completed) els.completed.textContent = completed;

  const workload = qlKitchenWorkload();
  const wEl = document.getElementById('workload-pct');
  if(wEl){
    wEl.textContent = workload.pct + '%';
    document.getElementById('workload-fill').style.width = workload.pct + '%';
    document.getElementById('workload-label').textContent = workload.pct >= 65 ? 'High Demand' : 'Normal';
    document.getElementById('workload-label').className = 'pill ' + (workload.pct >= 65 ? 'pill-red' : 'pill-teal');
    document.getElementById('workload-active').textContent = workload.active;
  }
}
