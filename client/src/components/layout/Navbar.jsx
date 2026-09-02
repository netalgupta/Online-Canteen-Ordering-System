import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useNotification } from '../../context/NotificationContext';
import { Menu, X, ShoppingCart, Bell, ChevronDown, LogOut } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { getTotal, toggleCart } = useCart();
  const { unreadCount } = useNotification();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const { itemCount } = getTotal();
  const role = user?.role;

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const navLinks = {
    student: [
      { name: 'Menu', path: '/' },
      { name: 'My Orders', path: '/orders' }
    ],
    staff: [
      { name: 'Dashboard', path: '/staff/dashboard' },
      { name: 'Kitchen', path: '/staff/kitchen' },
      { name: 'Pickup', path: '/staff/pickup' },
      { name: 'Inventory', path: '/staff/inventory' }
    ],
    admin: [
      { name: 'Analytics', path: '/admin/dashboard' },
      { name: 'Menu', path: '/admin/menu' },
      { name: 'Users', path: '/admin/users' },
      { name: 'Settings', path: '/admin/settings' }
    ]
  };

  const currentLinks = user ? navLinks[role] || [] : [];

  return (
    <nav className="bg-primary-600 text-white shadow-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            {user && (
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="sm:hidden p-2 -ml-2 mr-2 hover:bg-primary-700 rounded-md">
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            )}
            <Link to={role === 'admin' ? '/admin/dashboard' : role === 'staff' ? '/staff/dashboard' : '/'} className="flex items-center gap-2 font-bold text-xl">
              <span>🍽 Siddhi Canteen</span>
            </Link>
            
            {user && (
              <div className="hidden sm:flex ml-10 space-x-4">
                {currentLinks.map(link => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      location.pathname === link.path ? 'bg-primary-700' : 'hover:bg-primary-500'
                    }`}
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {user && (
            <div className="flex items-center space-x-2 sm:space-x-4">
              {role === 'student' && (
                <button onClick={toggleCart} className="relative p-2 hover:bg-primary-700 rounded-full transition-colors">
                  <ShoppingCart className="h-5 w-5" />
                  {itemCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-primary-600 bg-white rounded-full transform translate-x-1/4 -translate-y-1/4 animate-pulse-ring">
                      {itemCount}
                    </span>
                  )}
                </button>
              )}

              <Link to="/notifications" className="relative p-2 hover:bg-primary-700 rounded-full transition-colors hidden sm:block">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 block h-2.5 w-2.5 rounded-full bg-yellow-400 ring-2 ring-primary-600"></span>
                )}
              </Link>

              <div className="relative group hidden sm:block">
                <button onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center gap-2 p-2 hover:bg-primary-700 rounded-md transition-colors">
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-medium">{user.name}</span>
                    <span className="text-xs text-primary-200 capitalize">{role}</span>
                  </div>
                  <ChevronDown className="h-4 w-4" />
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 w-48 mt-1 py-1 bg-white rounded-md shadow-lg overflow-hidden border border-gray-100">
                    <button onClick={logout} className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && user && (
        <div className="sm:hidden bg-primary-700 border-t border-primary-500">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {currentLinks.map(link => (
              <Link
                key={link.path}
                to={link.path}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  location.pathname === link.path ? 'bg-primary-800' : 'hover:bg-primary-600'
                }`}
              >
                {link.name}
              </Link>
            ))}
            <Link to="/notifications" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-primary-600">
              Notifications {unreadCount > 0 && `(${unreadCount})`}
            </Link>
            <button onClick={logout} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium hover:bg-primary-600">
              Sign out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
