/* QueueLess — order state + per-item tracking */
const QL_STATUS_LABEL={received:'Order Received',accepted:'Order Accepted',preparing:'Preparing',ready:'Ready for Pickup',collected:'Collected'};
const QL_ACTIVE_STATUSES=['received','accepted','preparing'];
function qlNextOrderNumber(){let n=parseInt(localStorage.getItem('ql_counter')||'247',10)+1;localStorage.setItem('ql_counter',String(n));return n;}
function qlEstimatePrepTime(cartItems){const menu=qlGetMenu();let total=0;cartItems.forEach(ci=>{const m=menu.find(x=>x.id===ci.id);if(m) total+=m.prepTimeMinutes;});return Math.max(5,Math.min(25,total));}
function qlKitchenWorkload(){const active=qlGetOrders().filter(o=>QL_ACTIVE_STATUSES.includes(o.status));const pct=Math.min(100,Math.round((active.length/QL_CAPACITY)*100));return {active:active.length,capacity:QL_CAPACITY,pct};}
function qlCounterWorkload(counterId){const active=qlAllTracks().filter(t=>t.counterId===counterId && QL_ACTIVE_STATUSES.includes(t.status));const pct=Math.min(100,Math.round((active.length/QL_CAPACITY)*100));return {active:active.length,capacity:QL_CAPACITY,pct};}
function qlPickupMs(o){return new Date(o.pickupDate||o.createdAt).getTime();}
function qlTimeLeftLabel(target, now=Date.now()){const ms=new Date(target).getTime()-now;if(ms<=0)return 'Ready now';const total=Math.ceil(ms/60000);const days=Math.floor(total/1440);const hours=Math.floor((total%1440)/60);const mins=total%60;if(days>0)return `Ready in ${days}d ${hours}h`;if(hours>0)return `Ready in ${hours}h ${mins}m`;return `Ready in ${mins}m`;}
/* Queue priority follows the user's next pickup window. A slot that has already
   passed is not allowed to push a future 6:00 AM opening-time pickup behind it. */
function qlPriorityMs(o){
  const scheduled=qlPickupMs(o), now=Date.now();
  if(scheduled>=now) return scheduled;
  const d=new Date(scheduled);
  const next=new Date(now);
  next.setHours(d.getHours(),d.getMinutes(),d.getSeconds(),d.getMilliseconds());
  if(next.getTime()<now) next.setDate(next.getDate()+1);
  return next.getTime()+365*24*60*60*1000;
}
function qlAllTracks(){return qlGetOrders().flatMap(o=>(o.itemTracks||[]).filter(t=>t.status!=='collected').map(t=>({...t,orderId:o.id,pickupDate:o.pickupDate,pickupTime:o.pickupTime,createdAt:o.createdAt,counterId:t.counterId||qlGetItemCounter(qlGetMenu().find(m=>m.id===t.id)).id})));}
function qlQueuePosition(orderId,trackId){const tracks=qlAllTracks().sort((a,b)=>qlPriorityMs(a)-qlPriorityMs(b)||a.createdAt-b.createdAt);const idx=tracks.findIndex(t=>t.orderId===orderId&&(!trackId||t.trackId===trackId));return idx<0?0:idx;}
async function qlCreateOrder({items,pickupTime,pickupDate,pickupDateLabel,paymentMethod,instructions}){
 if(window.QL_BACKEND_ENABLED && window.qlBackend){await window.QL_BACKEND_READY;return await window.qlBackend.createOrder({items,pickupTime,pickupDate,pickupDateLabel,paymentMethod,instructions});}
 const menu=qlGetMenu();
 const targetPickup=new Date(pickupDate||Date.now());
 const slotKey=targetPickup.toISOString().slice(0,16);
 const slotCount=qlGetOrders().filter(o=>o&&o.pickupDate&&new Date(o.pickupDate).toISOString().slice(0,16)===slotKey&&Array.isArray(o.items)&&o.items.some(x=>Number(x.qty)>0)).length;
 if(slotCount >= QL_PICKUP_SLOT_CAPACITY) throw new Error('PICKUP_SLOT_FULL'); const subtotal=items.reduce((s,ci)=>{const m=menu.find(x=>x.id===ci.id);return s+(m?m.price*ci.qty:0)},0); const now=Date.now();
 const id='A'+qlNextOrderNumber(); const token=id.replace('A','');
 const pickupAt=new Date(pickupDate||now).getTime();
 const pickupDay=new Date(pickupAt); const openAt=new Date(pickupDay); openAt.setHours(6,0,0,0);
 const itemTracks=items.map((ci,i)=>{const m=menu.find(x=>x.id===ci.id);const prepMinutes=m?.prepTimeMinutes||5;const counter=qlGetItemCounter(m);const readyAt=Math.max(openAt.getTime(),pickupAt-(prepMinutes*60000));return {trackId:`${id}-T${i+1}`,id:ci.id,qty:ci.qty,instructions:ci.instructions||'',counterId:counter.id,counterName:counter.name,status:'received',prepTimeMinutes:prepMinutes,readyAt,notified:false,history:[{status:'received',at:now}]};});
 const order={id,token,items:items.map(ci=>({id:ci.id,qty:ci.qty,instructions:ci.instructions||''})),itemTracks,status:'received',subtotal,prepTime:Math.max(...itemTracks.map(t=>t.prepTimeMinutes),5),pickupTime,pickupDate:pickupDate||new Date().toISOString(),pickupDateLabel:pickupDateLabel||'Today',paymentMethod,studentName:(qlGetUser()||{}).name||'Student',studentEmail:(qlGetUser()||{}).email||'',createdAt:now,history:[{status:'received',at:now}]};
 const orders=qlGetOrders();orders.push(order);qlSaveOrders(orders);return order;
}
function qlRecomputeOrderStatus(o){const ts=(o.itemTracks||[]).map(t=>t.status);o.status=ts.every(s=>s==='collected')?'collected':ts.some(s=>s==='ready')?'ready':ts.some(s=>s==='preparing')?'preparing':ts.some(s=>s==='accepted')?'accepted':'received';}
async function qlAdvanceTrack(orderId,trackId,newStatus){const orders=qlGetOrders(),o=orders.find(x=>x.id===orderId);if(!o)return null;const t=(o.itemTracks||[]).find(x=>x.trackId===trackId);if(!t)return null;if(window.QL_BACKEND_ENABLED&&window.qlBackend){await window.qlBackend.updateItemStatus(trackId,newStatus);const refreshed=qlGetOrders().find(x=>x.id===orderId);const remoteTrack=refreshed?.itemTracks?.find(x=>x.trackId===trackId);if(refreshed&&remoteTrack){return {order:refreshed,track:remoteTrack};}}t.status=newStatus;t.history.push({status:newStatus,at:Date.now()});if(newStatus==='ready'){t.notified=false;qlNotifyItemReady(o,t);}qlRecomputeOrderStatus(o);o.history.push({status:o.status,at:Date.now()});qlSaveOrders(orders);return {order:o,track:t};}
function qlAdvanceOrder(orderId,newStatus){const o=qlGetOrder(orderId);if(!o)return null;if(o.itemTracks?.length){o.itemTracks.forEach(t=>{if(t.status!=='collected')t.status=newStatus;t.history.push({status:newStatus,at:Date.now()});});qlRecomputeOrderStatus(o);qlSaveOrders(qlGetOrders());return o;}const orders=qlGetOrders();const x=orders.find(y=>y.id===orderId);if(!x)return null;x.status=newStatus;x.history.push({status:newStatus,at:Date.now()});qlSaveOrders(orders);return x;}
function qlGetOrder(id){return qlGetOrders().find(o=>o.id===id)||null;}
function qlGetTrack(orderId,trackId){const o=qlGetOrder(orderId);return o&&o.itemTracks?o.itemTracks.find(t=>t.trackId===trackId):null;}
function qlLatestActiveOrder(){return qlGetStudentOrders().filter(o=>o.status!=='collected').sort((a,b)=>b.createdAt-a.createdAt)[0]||null;}
function qlOrderItemsText(order){const menu=qlGetMenu();return order.items.map(ci=>{const m=menu.find(x=>x.id===ci.id);return `${m?m.name:'Item'} × ${ci.qty}`}).join('\n');}

/* Preparation estimates are advisory only. Staff controls readiness. */
function qlProcessItemReadiness(){
  // Deliberately does NOT change an item's status automatically.
  // readyAt is only an approximate preparation-start/ETA calculation.
  // An item becomes Ready only when staff explicitly clicks 'Mark Ready'.
  return false;
}
function qlNotifyItemReady(order,track){
  const menu=qlGetMenu(); const item=menu.find(m=>m.id===track.id); const name=item?.name||'Your item';
  const message=`${name} is ready for pickup · Token ${order.token}`;
  try{
    if('Notification' in window && Notification.permission==='granted') new Notification('QueueLess · Ready for pickup',{body:message});
  }catch(e){}
  if(typeof qlToast==='function') qlToast(message);
}
function qlRequestReadyNotifications(){
  try{ if('Notification' in window && Notification.permission==='default') Notification.requestPermission().catch(()=>{}); }catch(e){}
}
