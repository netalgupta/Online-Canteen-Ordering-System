/* QueueLess authentication facade. Production mode delegates identity and authorization to Supabase. */
function qlLogin(name, email, role='student', approved=true, counterId=null){
  if(window.QL_BACKEND_ENABLED){throw new Error('Use Supabase email/password sign-in in backend mode.');}
  const user={name:name||'Student',email:email||'',phone:'',role,approved,counterId:role==='staff'?(counterId||'C4'):null};
  localStorage.setItem('ql_user',JSON.stringify(user));
}
async function qlLogout(){
  try{if(window.QL_BACKEND_ENABLED&&window.qlBackend)await window.qlBackend.signOut();else localStorage.removeItem('ql_user');}
  catch(e){console.error(e);}
  localStorage.removeItem('ql_cart');sessionStorage.clear();
  const base=window.location.pathname.includes('/staff/')||window.location.pathname.includes('/admin/')||window.location.pathname.includes('/student/')?'../login.html':'login.html';
  window.location.replace(base);
}
function qlRoleHome(role){if(role==='admin')return 'admin/dashboard.html';if(role==='staff')return 'staff/dashboard.html';return 'student/dashboard.html';}
function qlAuthLoginPath(){return window.location.pathname.includes('/staff/')||window.location.pathname.includes('/admin/')||window.location.pathname.includes('/student/')?'../login.html':'login.html';}
function qlRequireAuth(){
  if(window.QL_BACKEND_ENABLED&&window.qlBackend){
    window.qlBackend.client.auth.getSession().then(async({data,error})=>{
      if(error||!data.session){window.location.replace(qlAuthLoginPath());return;}
      try{const user=await window.qlBackend.client.from('ql_profiles').select('role,counter_id').eq('user_id',data.session.user.id).single();if(user.error||!user.data)window.location.replace(qlAuthLoginPath());}
      catch(e){window.location.replace(qlAuthLoginPath());}
    });
    return true;
  }
  const user=typeof qlGetUser==='function'?qlGetUser():null;
  if(!user||!user.role||user.approved!==true){window.location.replace(qlAuthLoginPath());return false;}return true;
}
function qlRequireRole(role){
  if(window.QL_BACKEND_ENABLED&&window.qlBackend){
    window.qlBackend.client.auth.getSession().then(async({data,error})=>{
      if(error||!data.session){window.location.replace(qlAuthLoginPath());return;}
      const {data:profile,error:profileError}=await window.qlBackend.client.from('ql_profiles').select('role,counter_id').eq('user_id',data.session.user.id).single();
      if(profileError||!profile||profile.role!==role){alert('This area is restricted to authorized '+role+' accounts.');window.location.replace(qlAuthLoginPath());return;}
      const cached=JSON.parse(localStorage.getItem('ql_user')||'{}');cached.role=profile.role;cached.counterId=profile.counter_id;localStorage.setItem('ql_user',JSON.stringify(cached));
    });
    return true;
  }
  const user=typeof qlGetUser==='function'?qlGetUser():null;
  if(!user||user.role!==role||user.approved!==true){alert('This area is restricted to approved '+role+' accounts.');window.location.replace(qlAuthLoginPath());return false;}return true;
}
