/* QueueLess prototype auth. Demo roles are intentionally open for the college-project prototype. */

function qlLogin(name, email, role='student', approved=true, counterId=null){
  const user = { name: name || 'Student', email: email || '', phone:'', role, approved, counterId: role==='staff' ? (counterId || 'C4') : null };
  localStorage.setItem('ql_user', JSON.stringify(user));
}

function qlLogout(){
  // Clear the signed-in identity and cart before navigating away.
  // This prevents the next demo account from inheriting the previous account's cart/session.
  try {
    localStorage.removeItem('ql_user');
    localStorage.removeItem('ql_cart');
    sessionStorage.clear();
  } finally {
    const base = window.location.pathname.includes('/staff/') || window.location.pathname.includes('/admin/') || window.location.pathname.includes('/student/') ? '../login.html' : 'login.html';
    window.location.replace(base);
  }
}

function qlRoleHome(role){
  if(role === 'admin') return 'admin/dashboard.html';
  if(role === 'staff') return 'staff/dashboard.html';
  return 'student/dashboard.html';
}

function qlRequireAuth(){
  const user = qlGetUser();
  if(!user || !user.role || user.approved !== true){
    const base = window.location.pathname.includes('/staff/') || window.location.pathname.includes('/admin/') || window.location.pathname.includes('/student/') ? '../login.html' : 'login.html';
    window.location.replace(base);
    return false;
  }
  return true;
}

function qlRequireRole(role){
  const user = qlGetUser();
  if(!user || user.role !== role || user.approved !== true){
    alert('This area is restricted to approved ' + role + ' accounts.');
    const base = window.location.pathname.includes('/staff/') || window.location.pathname.includes('/admin/') || window.location.pathname.includes('/student/') ? '../login.html' : 'login.html';
    window.location.replace(base);
    return false;
  }
  return true;
}
