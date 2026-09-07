import { defineConfig } from 'vite';
import { resolve } from 'path';

const r = (p) => resolve(__dirname, p);

// Multi-page app: every HTML file is its own entry point.
export default defineConfig({
  appType: 'mpa',
  build: {
    rollupOptions: {
      input: {
        index: r('index.html'),
        login: r('login.html'),
        register: r('register.html'),
        forgot: r('forgot-password.html'),
        reset: r('reset-password.html'),

        studentDashboard: r('student/dashboard.html'),
        studentMenu: r('student/menu.html'),
        studentFood: r('student/food.html'),
        studentCart: r('student/cart.html'),
        studentCheckout: r('student/checkout.html'),
        studentOrder: r('student/order.html'),
        studentTrack: r('student/track.html'),
        studentHistory: r('student/history.html'),
        studentProfile: r('student/profile.html'),

        staffDashboard: r('staff/dashboard.html'),
        staffMenu: r('staff/menu.html'),

        adminDashboard: r('admin/dashboard.html'),
        adminMenu: r('admin/menu.html'),
        adminAnalytics: r('admin/analytics.html'),
      },
    },
  },
});
