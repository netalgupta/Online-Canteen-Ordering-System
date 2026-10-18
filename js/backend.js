/* QueueLess browser data adapter for the Express + Supabase API. */
(function () {
  const API = '/api';
  const tokenKey = 'ql_supabase_token';
  const refreshTokenKey = 'ql_supabase_refresh_token';
  let refreshPromise = null;

  function clearSession() {
    localStorage.removeItem(tokenKey);
    localStorage.removeItem(refreshTokenKey);
    localStorage.removeItem('ql_user');
  }

  async function refreshSession() {
    const refreshToken = localStorage.getItem(refreshTokenKey);
    if (!refreshToken) return false;
    if (!refreshPromise) {
      refreshPromise = (async () => {
        const response = await fetch(`${API}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken })
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          if (response.status === 400 || response.status === 401) clearSession();
          throw new Error(data.error || `Session refresh failed (${response.status}).`);
        }
        localStorage.setItem(tokenKey, data.token);
        localStorage.setItem(refreshTokenKey, data.refreshToken);
        localStorage.setItem('ql_user', JSON.stringify({ ...data.user, approved: true }));
        return true;
      })().finally(() => { refreshPromise = null; });
    }
    return refreshPromise;
  }

  async function call(path, { method = 'GET', body } = {}, retried = false) {
    const token = localStorage.getItem(tokenKey);
    const response = await fetch(API + path, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) })
    });
    const data = await response.json().catch(() => ({}));
    if (response.status === 401 && !retried && await refreshSession()) {
      return call(path, { method, body }, true);
    }
    if (!response.ok) throw new Error(data.error || `Request failed (${response.status}).`);
    return data;
  }

  function mapMenu(item) {
    return {
      id: item.itemId || item.id,
      name: item.name,
      category: item.category,
      price: Number(item.price || 0),
      prepTimeMinutes: Number(item.prepTimeMinutes || 5),
      veg: item.veg !== false,
      available: item.available !== false,
      popular: Boolean(item.popular),
      desc: item.description || item.desc || '',
      image: item.image || ''
    };
  }

  function mapOrder(row) {
    const slot = new Date(row.pickupSlot);
    const tracks = (row.items || []).map(item => ({
      trackId: item._id || item.id,
      id: item.menuItemId,
      qty: item.quantity,
      instructions: item.instructions || '',
      counterId: item.counterId,
      counterName: (window.QL_COUNTERS?.[item.counterId]?.name) || item.counterId,
      status: item.status,
      prepTimeMinutes: item.prepTimeMinutes || 5,
      readyAt: item.readyAt || null,
      notified: false,
      history: []
    }));
    return {
      id: String(row._id || row.id),
      token: String(row.orderNumber),
      items: (row.items || []).map(item => ({
        id: item.menuItemId,
        qty: item.quantity,
        instructions: item.instructions || ''
      })),
      itemTracks: tracks,
      status: row.status || 'received',
      subtotal: Number(row.total || 0),
      total: Number(row.total || 0),
      prepTime: Math.max(5, ...tracks.map(track => track.prepTimeMinutes)),
      pickupTime: slot.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }),
      pickupDate: slot.toISOString(),
      pickupDateLabel: slot.toDateString() === new Date().toDateString()
        ? 'Today'
        : slot.toLocaleDateString(),
      paymentMethod: row.paymentMethod,
      studentName: row.customerName || '',
      studentEmail: row.customerEmail || '',
      createdAt: new Date(row.createdAt || Date.now()).getTime(),
      history: []
    };
  }

  function reportError(error, context) {
    console.error(context, error);
    window.dispatchEvent(new CustomEvent('ql:backend-error', {
      detail: { message: error.message || context }
    }));
  }

  async function refresh() {
    try {
      const menu = await call('/menu');
      const mappedMenu = (menu.items || []).map(mapMenu);
      localStorage.setItem('ql_menu', JSON.stringify(mappedMenu));
      window.QL_REMOTE_MENU_SNAPSHOT = mappedMenu.map(item => ({ ...item }));

      if (!localStorage.getItem(tokenKey)) {
        localStorage.removeItem('ql_user');
        localStorage.setItem('ql_orders', '[]');
        return null;
      }

      const { user } = await call('/auth/me');
      const currentUser = { ...user, approved: true };
      localStorage.setItem('ql_user', JSON.stringify(currentUser));

      if (currentUser.pendingApproval) {
        window.dispatchEvent(new CustomEvent('ql:backend-ready', { detail: { user: currentUser } }));
        return currentUser;
      }

      if (user.role === 'staff' || user.role === 'admin') {
        const { orders } = await call('/orders/queue');
        window.QL_STAFF_QUEUE = (orders || []).map(mapOrder);
      }
      const { orders } = await call('/orders/mine');
      localStorage.setItem('ql_orders', JSON.stringify((orders || []).map(mapOrder)));
      window.dispatchEvent(new CustomEvent('ql:backend-ready', { detail: { user: currentUser } }));
      return currentUser;
    } catch (error) {
      if (error.message.includes('sign in') || error.message.includes('session')) {
        localStorage.removeItem(tokenKey);
        localStorage.removeItem('ql_user');
      }
      reportError(error, 'QueueLess could not refresh data from the backend.');
      return null;
    }
  }

  async function refreshStaffQueue() {
    try {
      const { orders } = await call('/orders/queue');
      const mapped = (orders || []).map(mapOrder);
      window.QL_STAFF_QUEUE = mapped;
      return mapped;
    } catch (error) {
      reportError(error, 'QueueLess could not refresh the staff queue.');
      throw error;
    }
  }

  window.QL_BACKEND_ENABLED = true;
  window.QL_BACKEND_READY = Promise.resolve().then(refresh);
  window.qlBackend = {
    async signOut() {
      try {
        const response = await fetch(`${API}/auth/logout`, {
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

    async saveMenu(menu) {
      const snapshot = window.QL_REMOTE_MENU_SNAPSHOT || [];
      for (const item of menu) {
        const old = snapshot.find(entry => entry.id === item.id);
        const changed = !old || ['name', 'category', 'price', 'prepTimeMinutes', 'available', 'popular', 'desc', 'image']
          .some(key => old[key] !== item[key]);
        if (changed) {
          const payload = {
            name: item.name,
            category: item.category,
            price: Number(item.price),
            prepTimeMinutes: Number(item.prepTimeMinutes || 5),
            available: item.available !== false,
            popular: Boolean(item.popular),
            description: item.desc || '',
            image: item.image || ''
          };
          await call(`/menu/${encodeURIComponent(item.id)}`, {
            method: old ? 'PATCH' : 'PUT',
            body: payload
          });
        }
      }
      window.QL_REMOTE_MENU_SNAPSHOT = menu.map(item => ({ ...item }));
    },

    async createOrder({ items, pickupDate, paymentMethod, instructions }) {
      const pickupSlot = pickupDate || new Date(Date.now() + 15 * 60_000).toISOString();
      const { order } = await call('/orders', {
        method: 'POST',
        body: {
          items: items.map(item => ({
            id: item.id,
            qty: Number(item.qty),
            instructions: item.instructions || ''
          })),
          pickupSlot,
          paymentMethod: paymentMethod || 'pay-at-counter',
          instructions: instructions || ''
        }
      });
      await refresh();
      const mapped = mapOrder(order);
      const orders = JSON.parse(localStorage.getItem('ql_orders') || '[]');
      if (!orders.some(existing => existing.id === mapped.id)) {
        orders.unshift(mapped);
        localStorage.setItem('ql_orders', JSON.stringify(orders));
      }
      return mapped;
    },

    async updateItemStatus(trackId, status) {
      const queue = window.QL_STAFF_QUEUE || JSON.parse(localStorage.getItem('ql_orders') || '[]');
      let target = null;
      for (const order of queue) {
        const track = (order.itemTracks || []).find(item => item.trackId === trackId);
        if (track) {
          target = { order, track };
          break;
        }
      }
      if (!target) throw new Error('Order item not found. Refresh the staff queue.');
      await call(`/orders/${encodeURIComponent(target.order.id)}/items/${encodeURIComponent(trackId)}/status`, {
        method: 'PATCH',
        body: { status }
      });
      await refreshStaffQueue();
      return true;
    },

    async updateProfile(fields) {
      const { user } = await call('/auth/profile', { method: 'PATCH', body: fields });
      localStorage.setItem('ql_user', JSON.stringify({ ...user, approved: true }));
    },

    async updatePassword(currentPassword, newPassword) {
      await call('/auth/password', {
        method: 'PATCH',
        body: { currentPassword, newPassword }
      });
    },

    refresh,
    refreshStaffQueue,
    async loadQueue() {
      const { orders } = await call('/orders/queue');
      return orders.map(mapOrder);
    }
  };

  window.addEventListener('ql:backend-ready', () => {
    try {
      if (typeof render === 'function') render();
    } catch (error) {
      reportError(error, 'Could not render refreshed QueueLess data.');
    }
    try {
      if (typeof qlRenderKanban === 'function') qlRenderKanban();
      if (typeof qlRenderStats === 'function') qlRenderStats();
    } catch (error) {
      reportError(error, 'Could not render the staff dashboard.');
    }
  });
  window.addEventListener('ql:backend-error', event => {
    if (typeof qlToast === 'function') qlToast(event.detail.message);
  });
})();
