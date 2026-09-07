import '../app.js';
import { qlSignIn, qlSignInWithGoogle, qlGetProfile, ROLE_HOME } from '../auth.js';

const errBox = document.getElementById('err');
function showError(msg) { errBox.textContent = msg; errBox.classList.add('show'); }

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  errBox.classList.remove('show');
  const btn = document.getElementById('submit-btn');
  btn.disabled = true;
  try {
    await qlSignIn({
      email: document.getElementById('email').value.trim(),
      password: document.getElementById('password').value,
    });
    const profile = await qlGetProfile();
    window.location.href = ROLE_HOME[profile?.role] || '/student/dashboard.html';
  } catch (err) {
    showError(err.message || 'Could not log in. Check your credentials.');
    btn.disabled = false;
  }
});

document.getElementById('google-btn').addEventListener('click', async () => {
  try {
    await qlSignInWithGoogle();
  } catch (err) {
    showError(err.message || 'Google sign-in failed.');
  }
});
