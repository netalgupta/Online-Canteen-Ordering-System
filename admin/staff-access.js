(function () {
  if (!qlRequireRole('admin')) return;

  const tokenKey = 'ql_supabase_token';
  const el = id => document.getElementById(id);

  function message(text, ok = false) {
    const target = el('staff-message');
    target.textContent = text;
    target.style.display = 'block';
    target.style.color = ok ? '#237547' : 'var(--crimson-dark)';
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, character => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[character]);
  }

  async function api(path, options = {}) {
    const response = await fetch('/api' + path, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + localStorage.getItem(tokenKey),
        ...(options.headers || {})
      },
      body: options.body ? JSON.stringify(options.body) : undefined
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Request failed.');
    return data;
  }

  function counterName(id) {
    return ({
      C1: 'Counter 1 — Snacks & desserts',
      C2: 'Counter 2 — Frankie & juices',
      C3: 'Counter 3 — Chaat',
      C4: 'Counter 4 — All other items'
    })[id] || 'Not assigned';
  }

  async function load() {
    const wrap = el('staff-table-wrap');
    wrap.innerHTML = '<p class="text-sm muted">Loading accounts…</p>';
    try {
      const { users } = await api('/admin/staff-access');
      const visible = users.filter(user => user.role === 'staff' || user.role === 'student');
      if (!visible.length) {
        wrap.innerHTML = '<p class="text-sm muted">No registered student/staff accounts yet.</p>';
        return;
      }

      wrap.innerHTML = '<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;min-width:620px;"><thead><tr style="text-align:left;border-bottom:1px solid var(--line);"><th style="padding:10px 8px;">Name / email</th><th style="padding:10px 8px;">Status</th><th style="padding:10px 8px;">Counter</th><th style="padding:10px 8px;">Action</th></tr></thead><tbody>' +
        visible.map(user => {
          const pendingRequest = user.role === 'student' && user.requestedRole === 'staff';
          const status = user.role === 'staff'
            ? '<span class="pill pill-teal">Approved staff</span>'
            : pendingRequest
              ? '<span class="pill pill-amber">Staff request pending</span>'
              : '<span class="pill pill-muted">Student</span>';
          const counter = user.role === 'staff'
            ? counterName(user.counterId)
            : pendingRequest
              ? `${counterName(user.requestedCounter)} (requested)`
              : '—';
          const action = user.role === 'staff'
            ? `<button type="button" class="btn btn-outline revoke-staff" data-id="${escapeHtml(user.id)}" style="padding:8px 11px;">Revoke access</button>`
            : pendingRequest
              ? `<button type="button" class="btn btn-amber fill-request" data-email="${escapeHtml(user.email)}" data-counter="${escapeHtml(user.requestedCounter)}" style="padding:8px 11px;">Review request</button>`
              : '—';
          return `<tr style="border-bottom:1px solid var(--line);"><td style="padding:12px 8px;"><strong>${escapeHtml(user.name)}</strong><div class="text-xs muted">${escapeHtml(user.email)}</div></td><td style="padding:12px 8px;">${status}${user.verified ? '' : '<div class="text-xs muted">Email not confirmed</div>'}</td><td style="padding:12px 8px;">${escapeHtml(counter)}</td><td style="padding:12px 8px;">${action}</td></tr>`;
        }).join('') +
        '</tbody></table></div>';

      wrap.querySelectorAll('.fill-request').forEach(button => {
        button.addEventListener('click', () => {
          el('staff-email').value = button.dataset.email;
          if (button.dataset.counter) el('staff-counter').value = button.dataset.counter;
          el('staff-email').focus();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        });
      });
      wrap.querySelectorAll('.revoke-staff').forEach(button => {
        button.addEventListener('click', async () => {
          if (!confirm('Revoke this person’s staff access? They will return to student access.')) return;
          try {
            await api(`/admin/staff-access/${encodeURIComponent(button.dataset.id)}/revoke`, { method: 'PATCH' });
            message('Staff access revoked.', true);
            await load();
          } catch (error) {
            message(error.message);
          }
        });
      });
    } catch (error) {
      wrap.innerHTML = `<p class="text-sm" style="color:var(--crimson-dark)">${escapeHtml(error.message)}</p>`;
    }
  }

  el('staff-approve-form').addEventListener('submit', async event => {
    event.preventDefault();
    const button = el('staff-approve-btn');
    button.disabled = true;
    button.textContent = 'Approving…';
    try {
      const result = await api('/admin/staff-access/approve', {
        method: 'POST',
        body: {
          email: el('staff-email').value.trim(),
          counterId: el('staff-counter').value
        }
      });
      message(`${result.message} Ask the staff member to refresh their pending-access page.`, true);
      el('staff-email').value = '';
      await load();
    } catch (error) {
      message(error.message);
    } finally {
      button.disabled = false;
      button.textContent = 'Approve staff request';
    }
  });

  el('staff-refresh').addEventListener('click', load);
  try {
    const user = JSON.parse(localStorage.getItem('ql_user') || '{}');
    el('staff-admin-name').textContent = user.name || user.email || '';
  } catch (error) {
    console.error('Could not read the signed-in admin profile.', error);
  }
  load();
  if (window.lucide) window.lucide.createIcons();
})();
