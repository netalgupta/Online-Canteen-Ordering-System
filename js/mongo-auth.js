/* QueueLess — Supabase Auth client (browser-side, no backend required).
   Uses @supabase/supabase-js v2 via CDN.
   Implements the same qlMongoAuth interface the login/register pages expect. */

const _QL_SUPABASE_URL  = 'https://dziljonqqsmsdjjvunyh.supabase.co';
const _QL_SUPABASE_KEY  = 'sb_publishable_bYlF_z7ponOtO21Oh0-kWA_xGUvGK1T';

/* Supabase client is loaded via CDN <script> in the HTML pages. */
function _sbClient(){
  if(window._qlSbInstance) return window._qlSbInstance;
  if(!window.supabase) throw new Error('Supabase SDK not loaded yet.');
  window._qlSbInstance = window.supabase.createClient(_QL_SUPABASE_URL, _QL_SUPABASE_KEY, {
    auth:{ autoRefreshToken:true, persistSession:true, detectSessionInUrl:true }
  });
  return window._qlSbInstance;
}

window.qlMongoAuth = {
  /** Register — Supabase sends a 6-digit OTP to the user's email. */
  async signUp({name, email, password, rollNumber}){
    const sb = _sbClient();
    const { data, error } = await sb.auth.signUp({
      email, password,
      options:{
        data:{ name, roll_number: rollNumber || '' },
        emailRedirectTo: window.location.origin + '/login.html?verified=1'
      }
    });
    if(error) throw new Error(error.message);
    // Supabase sends a 6-digit OTP automatically when email confirmation is enabled
    return { message:'Account created! Check your email for the 6-digit verification code.', email, verificationRequired:true };
  },

  /** Verify the 6-digit OTP Supabase emailed. */
  async verifyOtp(email, otp){
    const sb = _sbClient();
    const { data, error } = await sb.auth.verifyOtp({ email, token: otp, type:'email' });
    if(error) throw new Error(error.message);
    return { ok:true, message:'Email verified!' };
  },

  /** Resend OTP. */
  async resendOtp(email){
    const sb = _sbClient();
    const { error } = await sb.auth.resend({ type:'signup', email });
    if(error) throw new Error(error.message);
    return { message:'New verification code sent!' };
  },

  /** Sign in with email + password. */
  async signIn(email, password){
    const sb = _sbClient();
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if(error){
      // If email not confirmed, trigger resend + surface OTP panel
      if(error.message.toLowerCase().includes('email not confirmed') || error.message.toLowerCase().includes('not confirmed')){
        await sb.auth.resend({ type:'signup', email }).catch(()=>{});
        const err = new Error('Please verify your email first. A new code has been sent.');
        err.data = { verificationRequired:true, email };
        throw err;
      }
      throw new Error(error.message);
    }
    const user = data.user;
    const meta = user.user_metadata || {};
    const role = meta.role || 'student';
    const profile = { id:user.id, name:meta.name||email.split('@')[0], email:user.email, role, counterId:meta.counterId||null, approved:true };
    localStorage.setItem('ql_user', JSON.stringify(profile));
    localStorage.setItem('ql_sb_access_token', data.session.access_token);
    return profile;
  },

  async signOut(){
    const sb = _sbClient();
    await sb.auth.signOut().catch(()=>{});
    localStorage.removeItem('ql_user');
    localStorage.removeItem('ql_sb_access_token');
    localStorage.removeItem('ql_orders');
    localStorage.removeItem('ql_mongo_token');
  },

  async me(){
    const sb = _sbClient();
    const { data:{ user }, error } = await sb.auth.getUser();
    if(error || !user) throw new Error('Please sign in again.');
    return { user };
  }
};

/* QL_BACKEND_ENABLED → false so localStorage/demo mode handles orders. */
window.QL_BACKEND_ENABLED = false;

function qlRoleHome(role){
  if(role==='admin')return 'admin/dashboard.html';
  if(role==='staff')return 'staff/dashboard.html';
  return 'student/dashboard.html';
}
