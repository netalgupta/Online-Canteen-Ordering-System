/* ==========================================================================
   QueueLess — shared app utilities
   ========================================================================== */

function qlToast(msg){
  let host = document.getElementById('toast-host');
  if(!host){
    host = document.createElement('div');
    host.id = 'toast-host';
    document.body.appendChild(host);
  }
  const t = document.createElement('div');
  t.className = 'toast';
  t.innerHTML = `<span class="dot"></span>${msg}`;
  host.appendChild(t);
  setTimeout(()=>{ t.style.transition='opacity .3s ease'; t.style.opacity='0'; setTimeout(()=>t.remove(), 300); }, 2600);
}

function qlIcons(){
  if(window.lucide) lucide.createIcons();
}

function qlFormatTime(date){
  return date.toLocaleTimeString('en-IN', { hour:'numeric', minute:'2-digit', hour12:true });
}

function qlAddMinutes(date, mins){
  return new Date(date.getTime() + mins*60000);
}

function qlCartCount(){
  return qlGetCart().reduce((sum,i)=>sum+i.qty, 0);
}

function qlUpdateCartBadge(){
  document.querySelectorAll('.cart-count').forEach(el=>{
    const n = qlCartCount();
    el.textContent = n;
    el.style.display = n > 0 ? 'flex' : 'none';
  });
}

// highlight active nav link based on current page filename
function qlSetActiveNav(){
  const path = window.location.pathname.split('/').pop();
  document.querySelectorAll('.nav-links a, .dash-nav a').forEach(a=>{
    const href = a.getAttribute('href') || '';
    if(href.endsWith(path) && path !== ''){
      a.classList.add('active');
    }
  });
}

document.addEventListener('DOMContentLoaded', ()=>{
  if(typeof qlProcessItemReadiness==='function') qlProcessItemReadiness();
  if(typeof qlRequestReadyNotifications==='function') qlRequestReadyNotifications();
  qlIcons();
  qlUpdateCartBadge();
  qlSetActiveNav();
  setInterval(()=>{ if(typeof qlProcessItemReadiness==='function') qlProcessItemReadiness(); }, 1000);
});
