import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import KitchenCard from '../../components/staff/KitchenCard';
import { useSocket } from '../../hooks/useSocket';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import { ArrowLeft } from 'lucide-react';

const KitchenViewPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { on, off } = useSocket();
  const navigate = useNavigate();

  const fetchOrders = async () => {
    try {
      const { data } = await api.get('/staff/orders');
      // Only keep accepted and preparing for Kitchen view
      setOrders(data.filter(o => ['accepted', 'preparing'].includes(o.status)));
    } catch (err) {
      toast.error('Failed to load kitchen orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    const handleStatusChanged = (data) => {
      setOrders(prev => {
        // If it moved out of preparing to ready, remove it
        if (data.status === 'ready' || data.status === 'collected') {
          return prev.filter(o => o._id !== data.orderId);
        }
        
        // If it moved into accepted/preparing
        const existingIdx = prev.findIndex(o => o._id === data.orderId);
        if (existingIdx >= 0) {
          const updated = [...prev];
          updated[existingIdx] = { ...updated[existingIdx], status: data.status, statusHistory: data.statusHistory };
          return updated;
        } else {
          // A new order was accepted (need full order data, normally fetch or get from socket payload)
          // For simplicity, refetch if we don't have it
          fetchOrders();
          return prev;
        }
      });
    };

    on('order:status_changed', handleStatusChanged);
    return () => off('order:status_changed', handleStatusChanged);
  }, [on, off]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await api.patch(`/staff/orders/${orderId}/status`, { status: newStatus });
      // Optimistic update
      if (newStatus === 'ready') {
        setOrders(prev => prev.filter(o => o._id !== orderId));
      } else {
        setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
      }
    } catch (err) {
      toast.error('Failed to update status');
      fetchOrders();
    }
  };

  const preparingCount = orders.filter(o => o.status === 'preparing').length;
  const acceptedCount = orders.filter(o => o.status === 'accepted').length;

  return (
    <div className="min-h-screen bg-content p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-8 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-4 text-gray-900">
          <Button variant="ghost" className="text-gray-600 hover:bg-gray-100" onClick={() => navigate('/staff/dashboard')}>
            <ArrowLeft className="w-5 h-5 mr-2" /> Back
          </Button>
          <h1 className="text-2xl font-bold">Kitchen Display</h1>
        </div>
        <div className="flex gap-4">
          <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-2 rounded-lg text-center font-bold">
            <div className="text-2xl leading-none">{preparingCount}</div>
            <div className="text-[10px] uppercase tracking-wider">Preparing</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded-lg text-center font-bold">
            <div className="text-2xl leading-none">{acceptedCount}</div>
            <div className="text-[10px] uppercase tracking-wider">Accepted</div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-gray-600 text-center text-xl py-12">Loading Orders...</div>
      ) : orders.length === 0 ? (
        <div className="text-gray-400 text-center text-2xl font-bold py-24">No Active Kitchen Orders</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {orders.map(order => (
            <KitchenCard 
              key={order._id} 
              order={order} 
              onStatusChange={handleStatusChange} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default KitchenViewPage;
