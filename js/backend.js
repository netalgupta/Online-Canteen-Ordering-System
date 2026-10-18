/* QueueLess MongoDB API adapter. The Express server enforces authentication and roles. */
(function(){
  const API='/api'; const tokenKey='ql_mongo_token';
  async function call(path,{method='GET',body}={}){
    const token=localStorage.getItem(tokenKey);
    const res=await fetch(API+path,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:body===undefined?undefined:JSON.stringify(body)});
    const data=await res.json().catch(()=>({})); if(!res.ok)throw new Error(data.error||`Request failed (${res.status})`); return data;
  }
  function mapMenu(x){return {id:x.itemId||x.id,name:x.name,category:x.category,price:Number(x.price||0),prepTimeMinutes:Number(x.prepTimeMinutes||5),veg:x.veg!==false,available:x.available!==false,popular:!!x.popular,desc:x.description||x.desc||'',image:x.image||''};}
  function mapOrder(row){const slot=new Date(row.pickupSlot);const tracks=(row.items||[]).map(t=>({trackId:t._id||t.id,id:t.menuItemId,qty:t.quantity,instructions:t.instructions||'',counterId:t.counterId,counterName:(window.QL_COUNTERS?.[t.counterId]?.name)||t.counterId,status:t.status,prepTimeMinutes:t.prepTimeMinutes||5,readyAt:null,notified:false,history:[]}));return {id:String(row._id),token:String(row.orderNumber),items:(row.items||[]).map(t=>({id:t.menuItemId,qty:t.quantity,instructions:t.instructions||''})),itemTracks:tracks,status:row.status||'received',subtotal:Number(row.total||0),total:Number(row.total||0),prepTime:Math.max(5,...tracks.map(t=>t.prepTimeMinutes)),pickupTime:slot.toLocaleTimeString('en-IN',{hour:'numeric',minute:'2-digit'}),pickupDate:slot.toISOString(),pickupDateLabel:slot.toDateString()===new Date().toDateString()?'Today':slot.toLocaleDateString(),paymentMethod:row.paymentMethod,studentName:row.customerName||'',studentEmail:row.customerEmail||'',createdAt:new Date(row.createdAt||Date.now()).getTime(),history:[]};}
  async function refresh(){
    try {const m=await call('/menu'); if(Array.isArray(m.items)&&m.items.length){const mapped=m.items.map(mapMenu);localStorage.setItem('ql_menu',JSON.stringify(mapped));window.QL_REMOTE_MENU_SNAPSHOT=mapped.map(x=>({...x}));}}
    catch(e){console.warn('MongoDB menu could not be refreshed; showing bundled demo menu.',e.message);}
    if(!localStorage.getItem(tokenKey)){localStorage.setItem('ql_orders','[]');return null;}
    try {const me=await call('/auth/me');const user=me.user;localStorage.setItem('ql_user',JSON.stringify({...user,approved:true}));const {orders}=await call('/orders/mine');const mapped=(orders||[]).map(mapOrder);localStorage.setItem('ql_orders',JSON.stringify(mapped));window.dispatchEvent(new CustomEvent('ql:backend-ready',{detail:{user}}));return user;}
    catch(e){if(e.message.includes('sign in')||e.message.includes('Account not found')){localStorage.removeItem(tokenKey);localStorage.removeItem('ql_user');}console.warn('MongoDB session refresh failed:',e.message);return null;}
  }
  window.QL_BACKEND_ENABLED=true;
  window.QL_BACKEND_READY=Promise.resolve().then(refresh);
  window.qlBackend={
    async signOut(){localStorage.removeItem(tokenKey);localStorage.removeItem('ql_user');localStorage.removeItem('ql_orders');},
    async saveMenu(menu){const user=JSON.parse(localStorage.getItem('ql_user')||'{}');const snapshot=window.QL_REMOTE_MENU_SNAPSHOT||[];for(const m of menu){const old=snapshot.find(x=>x.id===m.id);if(!old||['name','category','price','prepTimeMinutes','available','popular','desc','image'].some(k=>old[k]!==m[k])){const payload={name:m.name,category:m.category,price:Number(m.price),prepTimeMinutes:Number(m.prepTimeMinutes||5),available:m.available!==false,popular:!!m.popular,description:m.desc||'',image:m.image||''};await call('/menu/'+encodeURIComponent(m.id),{method:old?'PATCH':'PUT',body:payload});}}window.QL_REMOTE_MENU_SNAPSHOT=menu.map(x=>({...x}));},
    async createOrder({items,pickupDate,paymentMethod,instructions}){const slot=pickupDate||new Date(Date.now()+15*60000).toISOString();const {order}=await call('/orders',{method:'POST',body:{items:items.map(i=>({id:i.id,qty:Number(i.qty),instructions:i.instructions||''})),pickupSlot:slot,paymentMethod:paymentMethod||'pay-at-counter',instructions:instructions||''}});await refresh();const mapped=mapOrder(order);const orders=JSON.parse(localStorage.getItem('ql_orders')||'[]');if(!orders.some(o=>o.id===mapped.id)){orders.unshift(mapped);localStorage.setItem('ql_orders',JSON.stringify(orders));}return mapped;},
    async updateItemStatus(trackId,status){const orders=JSON.parse(localStorage.getItem('ql_orders')||'[]');let target=null;for(const o of orders){const t=(o.itemTracks||[]).find(x=>x.trackId===trackId);if(t){target={order:o,track:t};break;}}if(!target)throw new Error('Order item not found. Refresh the staff queue.');await call(`/orders/${encodeURIComponent(target.order.id)}/items/${encodeURIComponent(trackId)}/status`,{method:'PATCH',body:{status}});await refresh();return true;},
    async updateProfile(fields){const {user}=await call('/auth/profile',{method:'PATCH',body:fields});localStorage.setItem('ql_user',JSON.stringify({...user,approved:true}));},
    async updatePassword(currentPassword,newPassword){await call('/auth/password',{method:'PATCH',body:{currentPassword,newPassword}});},
    refresh,
    async loadQueue(){const {orders}=await call('/orders/queue');return orders.map(mapOrder);}
  };
  window.addEventListener('ql:backend-ready',()=>{try{if(typeof render==='function')render();if(typeof qlRenderKanban==='function')qlRenderKanban();if(typeof qlRenderStats==='function')qlRenderStats();}catch(e){}});
})();
