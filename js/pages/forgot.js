import '../app.js';
import { qlSendReset } from '../auth.js';

const errBox = document.getElementById('err');
const okBox = document.getElementById('ok');

document.getElementById('forgot-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  errBox.classList.remove('show');
  const btn = document.getElementById('submit-btn');
  btn.disabled = true;
  try {
    await qlSendReset(document.getElementById('email').value.trim());
    okBox.textContent = 'If that email has an account, a reset link is on its way.';
    okBox.classList.add('show');
  } catch (err) {
    errBox.textContent = err.message || 'Could not send reset link.';
    errBox.classList.add('show');
    btn.disabled = false;
  }
});
