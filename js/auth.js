/* ==========================================================================
   QueueLess — authentication (Supabase Auth)
   Email/password, Google OAuth, password reset, role-aware routing.
   ========================================================================== */
import { supabase } from './supabase.js';

// Where each role lands after login. Paths are relative to site root.
export const ROLE_HOME = {
  student: '/student/dashboard.html',
  staff: '/staff/dashboard.html',
  admin: '/admin/dashboard.html',
};

export async function qlSignUp({ name, email, password, role = 'student' }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, role },
      emailRedirectTo: `${window.location.origin}/login.html`,
    },
  });
  if (error) throw error;
  return data;
}

export async function qlSignIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function qlSignInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/auth-callback.html` },
  });
  if (error) throw error;
  return data;
}

export async function qlSendReset(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password.html`,
  });
  if (error) throw error;
}

export async function qlUpdatePassword(newPassword) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

export async function qlSignOut() {
  await supabase.auth.signOut();
  window.location.href = '/login.html';
}

export async function qlGetSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

// Fetch the profile row (name/role/etc) for the signed-in user.
export async function qlGetProfile() {
  const session = await qlGetSession();
  if (!session) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();
  if (error) {
    // Profile row may lag right after signup; fall back to auth metadata.
    const meta = session.user.user_metadata || {};
    return {
      id: session.user.id,
      name: meta.name || (session.user.email || 'Student').split('@')[0],
      email: session.user.email,
      role: meta.role || 'student',
    };
  }
  return data;
}

// Page guard: ensure a session exists and (optionally) the right role.
// Returns the profile, or redirects away and returns null.
export async function qlRequireAuth(requiredRole) {
  const session = await qlGetSession();
  if (!session) {
    window.location.href = '/login.html';
    return null;
  }
  const profile = await qlGetProfile();
  if (requiredRole && profile && profile.role !== requiredRole) {
    // Signed in but wrong area — send them to their own home.
    window.location.href = ROLE_HOME[profile.role] || '/login.html';
    return null;
  }
  return profile;
}
