/* QueueLess Supabase adapter. All authorization is enforced again by PostgreSQL RLS/RPCs. */
(function(){
  const url=window.QL_SUPABASE_URL, key=window.QL_SUPABASE_PUBLISHABLE_KEY;
  if(!window.supabase || !url || !key){ window.QL_BACKEND_ENABLED=false; console.warn('QueueLess backend SDK/config unavailable; backend mode disabled.'); return; }
  const client=window.supabase.createClient(url,key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  window.qlSupabase=client;
  const statusLabel={received:'received',accepted:'accepted',preparing:'preparing',ready:'ready',collected:'collected'};
  function fail(error){ if(error) throw error; }
  async function profileFor(user){
    if(!user)return null;
    const {data,error}=await client.from('ql_profiles').select('user_id,full_name,phone,role,counter_id').eq('user_id',user.id).maybeSingle();
    fail(error); return data?{id:data.user_id,name:data.full_name,email:user.email||'',phone:data.phone||'',role:data.role,approved:true,counterId:data.counter_id||null}:null;
  }
  async function getSessionUser(){ const {data,error}=await client.auth.getSession();fail(error);return data.session?.user||null; }
  function mapMenu(x){return {id:x.id,name:x.name,category:x.category,price:x.price,prepTimeMinutes:x.prep_time_minutes,veg:x.veg,available:x.available,popular:x.popular,desc:x.description||'',image:x.image_url||''};}
  function mapOrder(row,user){
    const tracks=(row.ql_order_items||[]).map(t=>({trackId:t.id,id:t.menu_item_id,qty:t.quantity,instructions:t.instructions||'',counterId:t.counter_id,counterName:(window.QL_COUNTERS?.[t.counter_id]?.name)||t.counter_id,status:t.status,prepTimeMinutes:t.prep_time_minutes,readyAt:t.estimated_ready_at?Date.parse(t.estimated_ready_at):null,notified:false,history:[]}));
    const items=(row.ql_order_items||[]).map(t=>({id:t.menu_item_id,qty:t.quantity,instructions:t.instructions||''}));
    const slot=new Date(row.pickup_slot);
    return {id:row.id,token:String(row.order_number),items,itemTracks:tracks,status:row.status,subtotal:row.total,total:row.total,prepTime:Math.max(5,...tracks.map(t=>t.prepTimeMinutes||5)),pickupTime:slot.toLocaleTimeString('en-IN',{hour:'numeric',minute:'2-digit'}),pickupDate:row.pickup_slot,pickupDateLabel:slot.toDateString()===new Date().toDateString()?'Today':'Scheduled',paymentMethod:row.payment_method,studentName:row.customer_name||user?.name||'Student',studentEmail:user?.email||'',createdAt:Date.parse(row.created_at),history:[]};
  }
  async function hydrate(){
    const authUser=await getSessionUser();
    let {data:menu,error:menuError}=await client.from('ql_menu_items').select('*').order('name');
    if(!menuError && Array.isArray(menu) && menu.length===0 && authUser){
      const {data:profile}=await client.from('ql_profiles').select('role').eq('user_id',authUser.id).maybeSingle();
      if(profile?.role==='admin' && Array.isArray(window.QL_MENU_SEED)){
        await window.qlBackend.saveMenu(window.QL_MENU_SEED);
        const refreshed=await client.from('ql_menu_items').select('*').order('name'); menu=refreshed.data; menuError=refreshed.error;
      }
    }
    if(!menuError && Array.isArray(menu) && menu.length){const mapped=menu.map(mapMenu);localStorage.setItem('ql_menu',JSON.stringify(mapped));window.QL_REMOTE_MENU_SNAPSHOT=mapped.map(m=>({...m}));}
    
    if(!authUser){localStorage.removeItem('ql_orders');return null;}
    const user=await profileFor(authUser);
    if(user)localStorage.setItem('ql_user',JSON.stringify(user));
    const {data:orders,error}=await client.from('ql_orders').select('*,ql_order_items(*)').order('created_at',{ascending:false}).limit(250);
    fail(error);
    const mappedOrders=(orders||[]).map(o=>mapOrder(o,user));
    let previous=[];try{previous=JSON.parse(localStorage.getItem('ql_orders')||'[]');}catch(e){}
    for(const order of mappedOrders){const old=previous.find(x=>x.id===order.id);if(!old)continue;for(const track of (order.itemTracks||[])){const oldTrack=(old.itemTracks||[]).find(t=>t.trackId===track.trackId);if(oldTrack&&oldTrack.status!=='ready'&&track.status==='ready'&&typeof qlNotifyItemReady==='function')qlNotifyItemReady(order,track);}}
    localStorage.setItem('ql_orders',JSON.stringify(mappedOrders));
    window.dispatchEvent(new CustomEvent('ql:backend-ready',{detail:{user}}));
    window.dispatchEvent(new CustomEvent('ql:orders-updated',{detail:{user,source:'supabase'}}));
    return user;
  }
  window.QL_BACKEND_READY=Promise.resolve(null);
  client.auth.onAuthStateChange((_event,session)=>{
    if(!session){localStorage.removeItem('ql_user');localStorage.removeItem('ql_orders');return;}
    // Avoid awaiting network calls inside the auth callback; Supabase recommends deferring them.
    setTimeout(()=>hydrate().catch(e=>console.error('QueueLess session sync failed:',e)),0);
  });
  if(typeof window.qlSaveMenu==='function'){
    const localMenuSave=window.qlSaveMenu;
    window.qlSaveMenu=function(menu){localMenuSave(menu);if(window.QL_BACKEND_ENABLED)window.qlBackend.saveMenu(menu).catch(e=>{console.error(e);if(typeof qlToast==='function')qlToast('Could not save menu to database. Check permissions.');});};
  }
  window.qlBackend={
    client,
    async signIn(email,password){const {data,error}=await client.auth.signInWithPassword({email,password});fail(error);const user=await profileFor(data.user);if(!user)throw new Error('Profile is missing. Contact the canteen administrator.');localStorage.setItem('ql_user',JSON.stringify(user));await hydrate();return user;},
    async signUp({name,email,password}){const {data,error}=await client.auth.signUp({email,password,options:{data:{full_name:name},emailRedirectTo:new URL('login.html',location.href).href}});fail(error);if(data.user && data.session){const {error:profileError}=await client.from('ql_profiles').update({full_name:name}).eq('user_id',data.user.id);fail(profileError);await hydrate();}return {user:data.user,session:data.session};},
    async signOut(){const {error}=await client.auth.signOut();fail(error);localStorage.removeItem('ql_user');localStorage.removeItem('ql_orders');},
    async resetPassword(email){const redirectTo=new URL('student/change-password.html',new URL('.',location.href)).href;const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo});fail(error);},
    async updatePassword(password){const {error}=await client.auth.updateUser({password});fail(error);},
    async updateProfile(fields){const sessionUser=await getSessionUser();if(!sessionUser)throw new Error('Please sign in again.');const allowed={full_name:fields.name,phone:fields.phone};Object.keys(allowed).forEach(k=>allowed[k]===undefined&&delete allowed[k]);const {error}=await client.from('ql_profiles').update(allowed).eq('user_id',sessionUser.id);fail(error);await hydrate();},
    async saveMenu(menu){
      const user=JSON.parse(localStorage.getItem('ql_user')||'{}');
      const counterFor=m=>(m.category==='Packaged Snacks'||m.category==='Desserts')?'C1':(['Frankie Counter','Juices'].includes(m.category)?'C2':m.category==='Chaat Items'?'C3':'C4');
      if(user.role==='staff'){
        const allowed=menu.filter(m=>counterFor(m)===user.counterId);
        for(const m of allowed){const result=await client.rpc('ql_staff_update_menu_item',{p_id:m.id,p_available:m.available!==false,p_prep_time_minutes:Number(m.prepTimeMinutes||5)});fail(result.error);}
        return;
      }
      if(user.role!=='admin')throw new Error('Only authorized staff/admin accounts can change menu items.');
      const snapshot=window.QL_REMOTE_MENU_SNAPSHOT||[];const before=new Map(snapshot.map(m=>[m.id,m]));
      const changed=menu.filter(m=>{const old=before.get(m.id);return !old||['name','category','price','prepTimeMinutes','available','popular','desc','image'].some(k=>old[k]!==m[k]);});
      const currentIds=new Set(menu.map(m=>m.id));const removed=snapshot.filter(m=>!currentIds.has(m.id));
      if(changed.length){const rows=changed.map(m=>({id:m.id,name:m.name,category:m.category,price:Number(m.price),prep_time_minutes:Number(m.prepTimeMinutes||5),veg:m.veg!==false,available:m.available!==false,popular:!!m.popular,description:m.desc||'',image_url:m.image||''}));const result=await client.rpc('ql_admin_upsert_menu',{p_items:rows});fail(result.error);}
      for(const item of removed){const result=await client.rpc('ql_admin_mark_menu_unavailable',{p_id:item.id});fail(result.error);}
      window.QL_REMOTE_MENU_SNAPSHOT=menu.map(m=>({...m}));
    },
    async createOrder({items,pickupDate,paymentMethod,instructions}){const payload=items.map(i=>({menuItemId:i.id,quantity:Number(i.qty),instructions:i.instructions||''}));const {data,error}=await client.rpc('ql_create_order',{p_items:payload,p_pickup_slot:pickupDate,p_payment_method:paymentMethod||'pay-at-counter',p_instructions:instructions||null});fail(error);await hydrate();const order=JSON.parse(localStorage.getItem('ql_orders')||'[]').find(o=>o.id===data.id);if(!order)throw new Error('Order created but could not be loaded. Refresh My Orders.');return order;},
    async updateItemStatus(itemId,status){const {data,error}=await client.rpc('ql_update_item_status',{p_order_item_id:itemId,p_new_status:status});fail(error);await hydrate();return data;},
    async submitProblem({type,orderReference,description}){const user=await getSessionUser();if(!user)throw new Error('Please sign in again.');const profile=await profileFor(user);const {data,error}=await client.from('ql_problem_reports').insert({user_id:user.id,student_name:profile?.name||user.email,student_email:user.email||'',problem_type:type,order_reference:orderReference||null,description}).select('id').single();fail(error);return data;},
    async adminListProblems(){const {data,error}=await client.from('ql_problem_reports').select('*').order('created_at',{ascending:false});fail(error);return data||[];},
    async updateProblemStatus(id,status,adminNote=''){const {error}=await client.from('ql_problem_reports').update({status,admin_note:adminNote}).eq('id',id);fail(error);},
    async adminListStaff(){const {data,error}=await client.rpc('ql_admin_list_staff');fail(error);return (data||[]).map(x=>({name:x.full_name,email:x.user_email,counterId:x.counter_id,createdAt:x.created_at}));},
    async setStaffAccess(email,counterId='C4',makeStaff=true){const {data,error}=await client.rpc('ql_admin_set_staff_access',{p_email:email,p_counter_id:counterId,p_make_staff:makeStaff});fail(error);return data;},
    async refresh(){return hydrate();},
    subscribeOrders(onChange){const ch=client.channel('queueless-live-orders').on('postgres_changes',{event:'*',schema:'public',table:'ql_orders'},()=>hydrate().then(onChange)).on('postgres_changes',{event:'*',schema:'public',table:'ql_order_items'},()=>hydrate().then(onChange)).subscribe();return ()=>client.removeChannel(ch);}
  };
  window.addEventListener('ql:backend-ready',()=>{try{if(typeof render==='function')render();if(typeof qlRenderKanban==='function')qlRenderKanban();if(typeof qlRenderStats==='function')qlRenderStats();}catch(e){console.debug('Deferred UI refresh skipped',e);}});
  window.QL_BACKEND_READY=hydrate().catch(e=>{console.error('QueueLess backend hydration failed:',e);return null;});
  client.channel('queueless-live-state').on('postgres_changes',{event:'*',schema:'public',table:'ql_orders'},()=>hydrate().catch(console.error)).on('postgres_changes',{event:'*',schema:'public',table:'ql_order_items'},()=>hydrate().catch(console.error)).subscribe();
})();
