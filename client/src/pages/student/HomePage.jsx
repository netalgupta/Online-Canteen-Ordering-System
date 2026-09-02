import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../../components/layout/PageLayout';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import MenuCard from '../../components/menu/MenuCard';
import FoodItemModal from '../../components/menu/FoodItemModal';
import { useApi } from '../../hooks/useApi';
import { menuService } from '../../services/menu.service';
import { orderService } from '../../services/order.service';
import { adminService } from '../../services/admin.service';
import api from '../../services/api';
import { HEAT_CONFIG, ACTIVE_STATUSES } from '../../utils/constants';
import OrderStatusBadge from '../../components/orders/OrderStatusBadge';

const HomePage = () => {
  const navigate = useNavigate();
  const [heat, setHeat] = useState('low');
  const [canteenStatus, setCanteenStatus] = useState({ isOpen: true, closeTime: '21:00' });
  const [activeOrder, setActiveOrder] = useState(null);
  
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalOpen, setModalOpen] = useState(false);

  const { data: popularItems, execute: fetchPopular } = useApi(menuService.getItems);
  const { execute: fetchMyOrders } = useApi(orderService.getMyOrders);

  useEffect(() => {
    // 1. Fetch Heat
    api.get('/staff/queue/heat').then(res => setHeat(res.data.heat || 'low')).catch(console.error);
    
    // 2. Fetch Status
    adminService.getSettings().then(data => {
      setCanteenStatus({ isOpen: data.isKitchenOpen, closeTime: data.operatingHours?.close || '9:00 PM' });
    }).catch(console.error);

    // 3. Fetch Popular
    fetchPopular({ sort: 'popular', limit: 4 });

    // 4. Fetch Active Order
    fetchMyOrders().then(orders => {
      const active = orders.find(o => ACTIVE_STATUSES.includes(o.status));
      if (active) setActiveOrder(active);
    }).catch(console.error);
  }, []);

  const heatConfig = HEAT_CONFIG[heat] || HEAT_CONFIG.low;

  return (
    <PageLayout>
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-700 to-primary-500 rounded-2xl p-8 sm:p-12 text-white shadow-lg mb-8 relative overflow-hidden">
        <div className="relative z-10 max-w-lg">
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-4">Siddhi Services Canteen</h1>
          <p className="text-lg sm:text-xl opacity-90 mb-8">Skip the queue. Pre-order your favorite meals and pick them up when ready.</p>
          <Button size="lg" className="bg-white text-primary-700 hover:bg-gray-50 shadow-md" onClick={() => navigate('/menu')}>
            Browse Menu
          </Button>
        </div>
        <div className="absolute -bottom-10 -right-10 text-[200px] opacity-10 hidden sm:block">🍽</div>
      </div>

      {/* Canteen Status */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className={`flex-1 rounded-xl p-4 border flex items-center gap-3 ${canteenStatus.isOpen ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
          <div className={`w-3 h-3 rounded-full ${canteenStatus.isOpen ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
          <span className="font-medium">
            {canteenStatus.isOpen ? `Canteen is open until ${canteenStatus.closeTime}` : 'Canteen is currently closed'}
          </span>
        </div>

        <div className={`flex-1 rounded-xl p-4 border flex items-center gap-3 ${heatConfig.bg} ${heatConfig.border} ${heatConfig.color}`}>
          <span className="text-xl">{heatConfig.emoji}</span>
          <span className="font-medium">
            {heat === 'low' && 'Canteen is quiet right now. Great time to order!'}
            {heat === 'moderate' && 'Moderate crowd. Order now to skip the wait.'}
            {heat === 'high' && 'HIGH LOAD — Pre-order to skip the long queue!'}
          </span>
        </div>
      </div>

      {/* Active Order Banner */}
      {activeOrder && (
        <Card className="mb-8 border-l-4 border-l-primary-500 bg-primary-50/30">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-900 mb-1">You have an active order</h3>
              <div className="flex items-center gap-3 text-sm">
                <span className="font-medium text-gray-700">ORDER #{activeOrder.orderNumber}</span>
                <OrderStatusBadge status={activeOrder.status} />
              </div>
            </div>
            <Button onClick={() => navigate(`/order/${activeOrder._id}`)}>
              Track Order
            </Button>
          </div>
        </Card>
      )}

      {/* Popular Items */}
      <div className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Popular Items</h2>
          <Button variant="ghost" onClick={() => navigate('/menu')}>View All</Button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {popularItems?.map(item => (
            <MenuCard 
              key={item._id} 
              item={item} 
              onClick={(it) => { setSelectedItem(it); setModalOpen(true); }}
            />
          ))}
        </div>
      </div>

      {/* How it works */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">How it works</h2>
        <div className="grid sm:grid-cols-3 gap-6 text-center">
          <div className="p-4">
            <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-2xl mx-auto mb-4">📱</div>
            <h3 className="font-bold text-gray-900 mb-2">1. Browse & Order</h3>
            <p className="text-gray-500 text-sm">Select items from the menu and place your order online.</p>
          </div>
          <div className="p-4">
            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-2xl mx-auto mb-4">⏳</div>
            <h3 className="font-bold text-gray-900 mb-2">2. Track Status</h3>
            <p className="text-gray-500 text-sm">Get real-time updates and estimated wait time.</p>
          </div>
          <div className="p-4">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-2xl mx-auto mb-4">🛍</div>
            <h3 className="font-bold text-gray-900 mb-2">3. Pick Up</h3>
            <p className="text-gray-500 text-sm">Show your QR code at the counter when order is ready.</p>
          </div>
        </div>
      </div>

      <FoodItemModal 
        item={selectedItem} 
        isOpen={isModalOpen} 
        onClose={() => { setModalOpen(false); setTimeout(() => setSelectedItem(null), 300); }} 
      />
    </PageLayout>
  );
};

export default HomePage;
