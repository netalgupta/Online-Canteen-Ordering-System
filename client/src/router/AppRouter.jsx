import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layout & Guards
import { ProtectedRoute, RoleRoute } from '../components/layout/ProtectedRoute';
import Navbar from '../components/layout/Navbar';
import CartDrawer from '../components/cart/CartDrawer';

// Auth Pages
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';

// Student Pages
import HomePage from '../pages/student/HomePage';
import MenuPage from '../pages/student/MenuPage';
import CartPage from '../pages/student/CartPage';
import CheckoutPage from '../pages/student/CheckoutPage';
import OrderTrackingPage from '../pages/student/OrderTrackingPage';
import OrderHistoryPage from '../pages/student/OrderHistoryPage';
import NotificationsPage from '../pages/student/NotificationsPage';

// Staff Pages
import StaffDashboardPage from '../pages/staff/StaffDashboardPage';
import KitchenViewPage from '../pages/staff/KitchenViewPage';
import PickupVerificationPage from '../pages/staff/PickupVerificationPage';
import InventoryPage from '../pages/staff/InventoryPage';

// Admin Pages
import AdminDashboardPage from '../pages/admin/AdminDashboardPage';
import MenuManagerPage from '../pages/admin/MenuManagerPage';
import UserManagerPage from '../pages/admin/UserManagerPage';
import SettingsPage from '../pages/admin/SettingsPage';

const AppRouter = () => {
  return (
    <>
      <Navbar />
      <CartDrawer />
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          
          {/* Student Routes */}
          <Route element={<RoleRoute allowedRoles={['student']} />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/menu" element={<MenuPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/order/:id" element={<OrderTrackingPage />} />
            <Route path="/orders" element={<OrderHistoryPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
          </Route>

          {/* Staff Routes */}
          <Route element={<RoleRoute allowedRoles={['staff', 'admin']} />}>
            <Route path="/staff" element={<Navigate to="/staff/dashboard" replace />} />
            <Route path="/staff/dashboard" element={<StaffDashboardPage />} />
            <Route path="/staff/kitchen" element={<KitchenViewPage />} />
            <Route path="/staff/pickup" element={<PickupVerificationPage />} />
            <Route path="/staff/inventory" element={<InventoryPage />} />
          </Route>

          {/* Admin Routes */}
          <Route element={<RoleRoute allowedRoles={['admin']} />}>
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin/menu" element={<MenuManagerPage />} />
            <Route path="/admin/users" element={<UserManagerPage />} />
            <Route path="/admin/settings" element={<SettingsPage />} />
          </Route>

        </Route>
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

export default AppRouter;
