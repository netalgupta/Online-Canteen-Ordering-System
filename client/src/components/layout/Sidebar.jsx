import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, UtensilsCrossed, ClipboardList, Bell, 
  LayoutDashboard, ChefHat, PackageCheck, Package, 
  Users, Settings, LogOut 
} from 'lucide-react';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  const role = user.role || 'student';

  const menuItems = {
    student: [
      { name: 'Home', path: '/', icon: <Home className="w-5 h-5" /> },
      { name: 'Menu', path: '/menu', icon: <UtensilsCrossed className="w-5 h-5" /> },
      { name: 'My Orders', path: '/orders', icon: <ClipboardList className="w-5 h-5" /> },
      { name: 'Notifications', path: '/notifications', icon: <Bell className="w-5 h-5" /> }
    ],
    staff: [
      { name: 'Dashboard', path: '/staff/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
      { name: 'Kitchen View', path: '/staff/kitchen', icon: <ChefHat className="w-5 h-5" /> },
      { name: 'Pickup', path: '/staff/pickup', icon: <PackageCheck className="w-5 h-5" /> },
      { name: 'Inventory', path: '/staff/inventory', icon: <Package className="w-5 h-5" /> }
    ],
    admin: [
      { name: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
      { name: 'Menu Manager', path: '/admin/menu', icon: <UtensilsCrossed className="w-5 h-5" /> },
      { name: 'Users', path: '/admin/users', icon: <Users className="w-5 h-5" /> },
      { name: 'Settings', path: '/admin/settings', icon: <Settings className="w-5 h-5" /> }
    ]
  };

  const items = menuItems[role] || menuItems.student;

  const handleNavigation = (path) => {
    navigate(path);
    if (window.innerWidth < 768) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed md:relative top-[52px] md:top-0 left-0 h-[calc(100vh-52px)] w-[200px] bg-sidebar z-40 transform transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } flex flex-col`}
      >
        <div className="flex-1 py-4 overflow-y-auto no-scrollbar flex flex-col gap-1">
          {items.map((item) => {
            const isActive = location.pathname === item.path || 
              (item.path !== '/' && location.pathname.startsWith(item.path));
            
            return (
              <div 
                key={item.path}
                className={`sidebar-item ${isActive ? 'active' : ''}`}
                onClick={() => handleNavigation(item.path)}
              >
                {item.icon}
                <span>{item.name}</span>
              </div>
            );
          })}
        </div>

        <div className="p-4 mt-auto border-t border-gray-700">
          <div 
            className="sidebar-item !px-0"
            onClick={logout}
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
