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
import { HEAT_CONFIG, ACTIVE_STATUSES } from '../../utils/constants';
import OrderStatusBadge from '../../components/orders/OrderStatusBadge';
import { AlertCircle, Clock, ShoppingBag } from 'lucide-react';

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
    fetchPopular({ sort: 'popular', limit: 4 });
    fetchMyOrders().then(orders => {
      const active = orders.find(o => ACTIVE_STATUSES.includes(o.status));
      if (active) setActiveOrder(active);
    }).catch(console.error);
  }, []);

  const heatConfig = HEAT_CONFIG[heat] || HEAT_CONFIG.low;
  const isPeakHour = heat === 'high';

  return (
    <PageLayout title="Student Dashboard" breadcrumb="Student Dashboard">
      
      {/* Alert Banner for Peak Hours */}
      {isPeakHour && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6 rounded-r shadow-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
          <div>
            <h3 className="text-amber-800 font-medium">It's peak hour!</h3>
            <p className="text-amber-700 text-sm mt-1">Expect longer wait times. We recommend ordering ahead.</p>
          </div>
        </div>
      )}

      {/* Top Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        
        {/* Canteen Status Card */}
        <Card className="flex items-center p-6 border-l-4 border-primary">
          <div className="rounded-full bg-primary-50 p-3 mr-4 text-primary-600">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium uppercase tracking-wider mb-1">Queue Status</p>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full animate-pulse ${canteenStatus.isOpen ? 'bg-green-500' : 'bg-red-500'}`} />
              <h2 className="text-xl font-bold text-gray-800">
                {canteenStatus.isOpen ? 'Open' : 'Closed'}
              </h2>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {canteenStatus.isOpen ? `Open until ${canteenStatus.closeTime}` : 'Check back tomorrow'}
            </p>
          </div>
        </Card>

        {/* Active Order Card */}
        <Card className={`p-6 border-l-4 ${activeOrder ? 'border-amber-500' : 'border-gray-300'}`}>
          {activeOrder ? (
            <div className="flex justify-between items-center h-full">
              <div className="flex items-center">
                <div className="rounded-full bg-amber-50 p-3 mr-4 text-amber-600">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium uppercase tracking-wider mb-1">Active Order</p>
                  <h2 className="text-xl font-bold text-gray-800">#{activeOrder.orderNumber}</h2>
                  <div className="mt-1"><OrderStatusBadge status={activeOrder.status} /></div>
                </div>
              </div>
              <Button onClick={() => navigate(`/order/${activeOrder._id}`)} variant="outline">
                Track
              </Button>
            </div>
          ) : (
            <div className="flex items-center h-full opacity-60">
              <div className="rounded-full bg-gray-100 p-3 mr-4 text-gray-400">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium uppercase tracking-wider mb-1">No Active Orders</p>
                <h2 className="text-lg font-bold text-gray-700">Ready to eat?</h2>
              </div>
              <Button onClick={() => navigate('/menu')} variant="primary" className="ml-auto">
                Order Now
              </Button>
            </div>
          )}
        </Card>

      </div>

      {/* Popular Items - Horizontal Scroll */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-800">Popular Today</h2>
          <Button variant="ghost" size="sm" onClick={() => navigate('/menu')} className="text-primary-600">
            View full menu &rarr;
          </Button>
        </div>
        
        <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar -mx-2 px-2">
          {popularItems?.map(item => (
            <div key={item._id} className="min-w-[240px] md:min-w-[280px]">
              <MenuCard 
                item={item} 
                onClick={(it) => { setSelectedItem(it); setModalOpen(true); }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <Card className="p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-6 text-center">How it works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-gray-100">
          <div className="p-4 text-center">
            <div className="w-12 h-12 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center text-xl mx-auto mb-3">📱</div>
            <h3 className="font-bold text-gray-800 mb-1">1. Browse & Order</h3>
            <p className="text-gray-500 text-sm">Select items and place your order.</p>
          </div>
          <div className="p-4 text-center">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center text-xl mx-auto mb-3">⏳</div>
            <h3 className="font-bold text-gray-800 mb-1">2. Track Status</h3>
            <p className="text-gray-500 text-sm">Get real-time status updates.</p>
          </div>
          <div className="p-4 text-center">
            <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center text-xl mx-auto mb-3">🛍</div>
            <h3 className="font-bold text-gray-800 mb-1">3. Pick Up</h3>
            <p className="text-gray-500 text-sm">Show QR code when ready.</p>
          </div>
        </div>
      </Card>

      <FoodItemModal 
        item={selectedItem} 
        isOpen={isModalOpen} 
        onClose={() => { setModalOpen(false); setTimeout(() => setSelectedItem(null), 300); }} 
      />
    </PageLayout>
  );
};

export default HomePage;
