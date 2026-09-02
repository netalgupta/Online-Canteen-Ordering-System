import React, { useState, useEffect } from 'react';
import PageLayout from '../../components/layout/PageLayout';
import StatusLane from '../../components/staff/StatusLane';
import StaffOrderCard from '../../components/staff/StaffOrderCard';
import { useSocket } from '../../hooks/useSocket';
import api from '../../services/api';
import toast from 'react-hot-toast';

const StaffDashboardPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { on, off } = useSocket();
  const [activeTab, setActiveTab] = useState('received'); // For mobile

  const fetchOrders = async () => {
    try {
      const { data } = await api.get('/staff/orders');
      setOrders(data);
    } catch (err) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    const handleNewOrder = (order) => {
      setOrders(prev => [order, ...prev]);
      toast.success(`New order #${order.orderNumber} received!`);
      // Flash animation could be handled by a state trigger if needed
    };

    const handleStatusChanged = (data) => {
      setOrders(prev => prev.map(o => 
        o._id === data.orderId 
          ? { ...o, status: data.status, statusHistory: data.statusHistory } 
          : o
      ));
    };

    on('order:new', handleNewOrder);
    on('order:status_changed', handleStatusChanged);
    return () => {
      off('order:new', handleNewOrder);
      off('order:status_changed', handleStatusChanged);
    };
  }, [on, off]);

  const handleStatusChange = async (orderId, newStatus, extraData = {}) => {
    try {
      await api.patch(`/staff/orders/${orderId}/status`, { status: newStatus, ...extraData });
      toast.success(`Order moved to ${newStatus}`);
      // Optimistic update
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
    } catch (err) {
      toast.error('Failed to update status');
      fetchOrders(); // Revert
    }
  };

  const getOrdersByStatus = (status) => orders.filter(o => o.status === status).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  const columns = [
    { id: 'received', title: 'Incoming', color: 'border-b-red-500 text-red-700 bg-red-50', data: getOrdersByStatus('received') },
    { id: 'accepted', title: 'Accepted', color: 'border-b-blue-500 text-blue-700 bg-blue-50', data: getOrdersByStatus('accepted') },
    { id: 'preparing', title: 'Preparing', color: 'border-b-amber-500 text-amber-700 bg-amber-50', data: getOrdersByStatus('preparing') },
    { id: 'ready', title: 'Ready', color: 'border-b-green-500 text-green-700 bg-green-50', data: getOrdersByStatus('ready') }
  ];

  return (
    <PageLayout title="Live Dashboard">
      {/* Mobile Tabs */}
      <div className="flex overflow-x-auto gap-2 mb-4 lg:hidden no-scrollbar">
        {columns.map(col => (
          <button
            key={col.id}
            onClick={() => setActiveTab(col.id)}
            className={`px-4 py-2 rounded-full whitespace-nowrap font-bold text-sm transition-colors ${
              activeTab === col.id ? 'bg-gray-900 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            {col.title} ({col.data.length})
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100vh-200px)]">
        {columns.map(col => (
          <div key={col.id} className={`h-full ${activeTab !== col.id ? 'hidden lg:block' : 'block'}`}>
            <StatusLane title={col.title} count={col.data.length} colorClass={col.color}>
              {col.data.map(order => (
                <StaffOrderCard 
                  key={order._id} 
                  order={order} 
                  onStatusChange={handleStatusChange} 
                />
              ))}
            </StatusLane>
          </div>
        ))}
      </div>
    </PageLayout>
  );
};

export default StaffDashboardPage;
