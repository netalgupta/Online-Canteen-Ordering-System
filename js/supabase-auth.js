/* QueueLess browser auth calls the Express API; Supabase credentials stay server-side. */
(function () {
  const tokenKey = 'ql_supabase_token';
  const refreshTokenKey = 'ql_supabase_refresh_token';
  let refreshPromise = null;

  function clearSession() {
    localStorage.removeItem(tokenKey);
    localStorage.removeItem(refreshTokenKey);
    localStorage.removeItem('ql_user');
  }

  function saveSession(data) {
    localStorage.setItem(tokenKey, data.token);
    localStorage.setItem(refreshTokenKey, data.refreshToken);
    localStorage.setItem('ql_user', JSON.stringify({ ...data.user, approved: true }));
  }

  async function refreshSession() {
    const refreshToken = localStorage.getItem(refreshTokenKey);
    if (!refreshToken) return false;
    if (!refreshPromise) {
      refreshPromise = (async () => {
        const response = await fetch('/api/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken })
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          if (response.status === 400 || response.status === 401) clearSession();
          throw new Error(data.error || `Session refresh failed (${response.status}).`);
        }
        saveSession(data);
        return true;
      })().finally(() => { refreshPromise = null; });
    }
    return refreshPromise;
  }

  async function request(path, { method = 'GET', body } = {}, retried = false) {
    const token = localStorage.getItem(tokenKey);
    const response = await fetch(`/api${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) })
    });
    const data = await response.json().catch(() => ({}));
    if (response.status === 401 && !retried && await refreshSession()) {
      return request(path, { method, body }, true);
    }
    if (!response.ok) {
      const error = new Error(data.error || `Request failed (${response.status}).`);
      error.data = data;
      throw error;
    }
    return data;
  }

  window.qlAuth = {
    async signUp({ name, email, password, rollNumber, requestedRole = 'student', requestedCounter = null }) {
      return request('/auth/register', {
        method: 'POST',
        body: { name, email, password, rollNumber, requestedRole, requestedCounter }
      });
    },

    async verifyOtp(email, otp) {
      return request('/auth/verify-otp', { method: 'POST', body: { email, otp } });
    },

    async resendOtp(email) {
      return request('/auth/resend-otp', { method: 'POST', body: { email } });
    },

    async signIn(email, password) {
      const data = await request('/auth/login', { method: 'POST', body: { email, password } });
      saveSession(data);
      return data.user;
    },

    async signOut() {
      try {
        const response = await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(localStorage.getItem(tokenKey)
              ? { Authorization: `Bearer ${localStorage.getItem(tokenKey)}` }
              : {})
          },
          body: JSON.stringify({ refreshToken: localStorage.getItem(refreshTokenKey) })
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || `Request failed (${response.status}).`);
      } finally {
        clearSession();
        localStorage.removeItem('ql_orders');
      }
    },

    async me() {
      return request('/auth/me');
    }
  };
})();
