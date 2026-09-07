import '../app.js';
import { qlSignUp, qlSignInWithGoogle, qlGetSession, qlGetProfile, ROLE_HOME } from '../auth.js';

let role = 'student';
const errBox = document.getElementById('err');
const okBox = document.getElementById('ok');
function showError(msg) { errBox.textContent = msg; errBox.classList.add('show'); okBox.classList.remove('show'); }
function showOk(msg) { okBox.textContent = msg; okBox.classList.add('show'); errBox.classList.remove('show'); }

document.querySelectorAll('#role-quick button').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#role-quick button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    role = btn.dataset.role;
  });
});

document.getElementById('register-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  errBox.classList.remove('show');
  const btn = document.getElementById('submit-btn');
  btn.disabled = true;
  try {
    await qlSignUp({
      name: document.getElementById('name').value.trim(),
      email: document.getElementById('email').value.trim(),
      password: document.getElementById('password').value,
      role,
    });
    // If email confirmation is off, a session exists immediately -> route in.
    const session = await qlGetSession();
    if (session) {
      const profile = await qlGetProfile();
      window.location.href = ROLE_HOME[profile?.role] || ROLE_HOME[role];
    } else {
      showOk('Account created. Check your email to confirm, then log in.');
      btn.disabled = false;
    }
  } catch (err) {
    showError(err.message || 'Could not create account.');
    btn.disabled = false;
  }
});

document.getElementById('google-btn').addEventListener('click', async () => {
  try { await qlSignInWithGoogle(); }
  catch (err) { showError(err.message || 'Google sign-up failed.'); }
});
