/* QueueLess MongoDB auth client — OTP-based email verification. */
(function(){
  const API='/api'; const tokenKey='ql_mongo_token';
  async function call(path,body){
    const r=await fetch(API+path,{method:body?'POST':'GET',headers:{'Content-Type':'application/json',...(localStorage.getItem(tokenKey)?{Authorization:'Bearer '+localStorage.getItem(tokenKey)}:{})},body:body?JSON.stringify(body):undefined});
    const data=await r.json().catch(()=>({}));
    if(!r.ok)throw Object.assign(new Error(data.error||'Request failed.'),{status:r.status,data});
    return data;
  }
  window.qlMongoAuth={
    /** Register — server sends a 6-digit OTP to the user's email. */
    async signUp({name,email,password,rollNumber}){
      return call('/auth/register',{name,email,password,rollNumber});
    },
    /** Verify email with the 6-digit OTP the user typed in. */
    async verifyOtp(email,otp){
      return call('/auth/verify-otp',{email,otp});
    },
    /** Resend a fresh OTP to the given email. */
    async resendOtp(email){
      return call('/auth/resend-otp',{email});
    },
    /** Sign in. If unverified, server returns verificationRequired:true + sends a fresh OTP. */
    async signIn(email,password){
      const result=await call('/auth/login',{email,password});
      localStorage.setItem(tokenKey,result.token);
      localStorage.setItem('ql_user',JSON.stringify({...result.user,approved:true}));
      return result.user;
    },
    async signOut(){
      localStorage.removeItem(tokenKey);
      localStorage.removeItem('ql_user');
      localStorage.removeItem('ql_orders');
    },
    async me(){return call('/auth/me');}
  };
})();
function qlRoleHome(role){if(role==='admin')return 'admin/dashboard.html';if(role==='staff')return 'staff/dashboard.html';return 'student/dashboard.html';}
