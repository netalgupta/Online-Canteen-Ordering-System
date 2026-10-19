/* QueueLess — live admin analytics; no fabricated baseline values. */
const QL_ADMIN_BASELINE = {ordersByHour:[], revenueByDay:[], popular:[]};
function qlAdminStats(){
  const orders=qlGetOrders();
  const today=new Date(); const sameDay=d=>{const x=new Date(d);return x.toDateString()===today.toDateString();};
  const todays=orders.filter(o=>sameDay(o.createdAt||0));
  const completed=todays.filter(o=>['ready','collected','completed'].includes(o.status));
  const hourCounts=new Map();
  for(const o of todays){const d=new Date(o.createdAt||0);const h=d.getHours();hourCounts.set(h,(hourCounts.get(h)||0)+1);}
  const peak=[...hourCounts.entries()].sort((a,b)=>b[1]-a[1])[0];
  const waits=todays.filter(o=>o.prepTime).map(o=>Number(o.prepTime));
  const itemCounts=new Map();
  for(const o of orders)for(const t of (o.itemTracks||[])){const m=qlGetMenu().find(x=>x.id===t.id);if(m)itemCounts.set(m.name,(itemCounts.get(m.name)||0)+Number(t.qty||0));}
  QL_ADMIN_BASELINE.ordersByHour=Array.from({length:10},(_,i)=>{const h=8+i;return {h:(h%12||12)+(h<12?' AM':' PM'),v:hourCounts.get(h)||0};}).filter(x=>x.v>0);
  QL_ADMIN_BASELINE.popular=[...itemCounts].sort((a,b)=>b[1]-a[1]).slice(0,5).map(([name,orders])=>({name,orders}));
  return {todaysOrders:todays.length,revenue:todays.reduce((s,o)=>s+Number(o.subtotal||o.total||0),0),avgWait:waits.length?Math.round(waits.reduce((a,b)=>a+b,0)/waits.length):0,peakHour:peak?`${new Date(0,0,0,peak[0]).toLocaleTimeString('en-IN',{hour:'numeric'})}`:'—',cancelled:orders.filter(o=>o.status==='cancelled').length};
}
function qlAdminPriorityQueue(){return qlGetOrders().flatMap(o=>(o.itemTracks||[]).filter(t=>t.status!=='collected').map(t=>({order:o,track:t}))).sort((a,b)=>qlPriorityMs(a.order)-qlPriorityMs(b.order)||a.order.createdAt-b.order.createdAt);}
