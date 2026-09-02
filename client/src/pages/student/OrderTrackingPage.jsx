import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageLayout from '../../components/layout/PageLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import OrderTimeline from '../../components/orders/OrderTimeline';
import QueueStatus from '../../components/orders/QueueStatus';
import PickupQR from '../../components/orders/PickupQR';
import OrderStatusBadge from '../../components/orders/OrderStatusBadge';
import { useApi } from '../../hooks/useApi';
import { useSocket } from '../../hooks/useSocket';
import { orderService } from '../../services/order.service';
import toast from 'react-hot-toast';
import { ACTIVE_STATUSES } from '../../utils/constants';

const OrderTrackingPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [queue, setQueue] = useState(null);
  const [feedback, setFeedback] = useState({ rating: 0, comment: '' });
  
  const { execute: fetchOrder, loading: orderLoading } = useApi(orderService.getOrder);
  const { execute: fetchQueue } = useApi(orderService.getQueueStatus);
  const { execute: cancelOrder, loading: isCancelling } = useApi(orderService.cancelOrder);
  const { socket, isConnected, on, off } = useSocket();

  const loadData = async () => {
    try {
      const o = await fetchOrder(id);
      setOrder(o);
      if (ACTIVE_STATUSES.includes(o.status)) {
        const q = await fetchQueue(id);
        setQueue(q);
      }
    } catch (err) {
      navigate('/orders');
    }
  };

  useEffect(() => {
    loadData();
    // Fallback polling if disconnected
    let interval;
    if (!isConnected) {
      interval = setInterval(loadData, 10000);
    }
    return () => clearInterval(interval);
  }, [id, isConnected]);

  useEffect(() => {
    const handleStatusChange = (data) => {
      if (data.orderId === id) {
        setOrder(prev => ({ ...prev, status: data.status, statusHistory: data.statusHistory }));
        if (ACTIVE_STATUSES.includes(data.status)) fetchQueue(id).then(setQueue);
      }
    };
    
    const handleQueueUpdate = (data) => {
      if (data.orderId === id) {
        setQueue(prev => ({ ...prev, ...data }));
      }
    };

    on('order:status_changed', handleStatusChange);
    on('order:queue_updated', handleQueueUpdate);
    
    return () => {
      off('order:status_changed', handleStatusChange);
      off('order:queue_updated', handleQueueUpdate);
    };
  }, [id, on, off]);

  const handleCancel = async () => {
    if (window.confirm('Are you sure you want to cancel this order? This cannot be undone.')) {
      try {
        await cancelOrder(id, 'Cancelled by user');
        toast.success('Order cancelled successfully');
        loadData();
      } catch (e) {
        // handled by useApi
      }
    }
  };

  const handleSubmitFeedback = async () => {
    // API logic to be added
    toast.success('Thank you for your feedback!');
  };

  if (orderLoading && !order) return <PageLayout><div className="flex justify-center py-12"><div className="animate-spin text-primary-600">⏳</div></div></PageLayout>;
  if (!order) return null;

  const isTerminal = ['collected', 'rejected', 'cancelled', 'expired'].includes(order.status);
  const canCancel = ['placed', 'received'].includes(order.status);

  return (
    <PageLayout>
      {!isConnected && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-2 text-sm rounded-lg mb-6 flex justify-center items-center gap-2">
          <span>⚠</span> Connection lost. Updates may be delayed.
        </div>
      )}

      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Order Number</p>
            <h1 className="text-3xl font-black text-gray-900">#{order.orderNumber}</h1>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>

        {['rejected', 'cancelled', 'expired'].includes(order.status) && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-xl">
            <h3 className="text-red-800 font-bold mb-1">Order {order.status}</h3>
            {order.rejectionReason && <p className="text-red-600 text-sm">{order.rejectionReason}</p>}
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-6">
          <Card className="flex flex-col">
            <h3 className="font-bold text-gray-900 mb-4 border-b pb-2">Status Tracker</h3>
            <OrderTimeline order={order} />
          </Card>

          <div className="space-y-6">
            {!isTerminal && queue && (
              <QueueStatus 
                queuePosition={queue.queuePosition}
                estimatedWaitTime={queue.estimatedWaitTime}
                estimatedReadyTime={queue.estimatedReadyTime}
                heat={queue.heat}
              />
            )}
            
            <PickupQR 
              orderNumber={order.orderNumber}
              pickupCode={order.pickupCode}
              isReady={order.status === 'ready'}
            />
          </div>
        </div>

        <Card>
          <h3 className="font-bold text-gray-900 mb-4 border-b pb-2">Items Ordered</h3>
          <div className="space-y-3 divide-y divide-gray-100">
            {order.items.map((item, idx) => (
              <div key={idx} className="pt-3 first:pt-0 flex justify-between">
                <div>
                  <span className="font-medium text-gray-900">{item.quantity}× {item.name}</span>
                  {item.specialInstructions && (
                    <p className="text-xs text-gray-500 italic mt-0.5">Note: {item.specialInstructions}</p>
                  )}
                </div>
                <span className="font-medium text-gray-900">₹{item.price * item.quantity}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center mt-6 pt-4 border-t-2 border-gray-100">
            <span className="text-gray-900 font-bold">Total</span>
            <span className="text-xl font-black text-primary-600">₹{order.total}</span>
          </div>
        </Card>

        {canCancel && (
          <Button 
            variant="danger" 
            fullWidth 
            onClick={handleCancel}
            loading={isCancelling}
          >
            Cancel Order
          </Button>
        )}

        {order.status === 'collected' && (
          <Card className="bg-primary-50 border-primary-100">
            <h3 className="font-bold text-gray-900 mb-2">How was your meal?</h3>
            <div className="flex gap-2 mb-4">
              {[1, 2, 3, 4, 5].map(star => (
                <button 
                  key={star}
                  onClick={() => setFeedback(p => ({ ...p, rating: star }))}
                  className={`text-2xl ${feedback.rating >= star ? 'text-yellow-400' : 'text-gray-300'}`}
                >
                  ★
                </button>
              ))}
            </div>
            {feedback.rating > 0 && (
              <>
                <textarea
                  className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:ring-primary-500 focus:border-primary-500 mb-3"
                  rows={2}
                  placeholder="Tell us what you liked or how we can improve..."
                  value={feedback.comment}
                  onChange={e => setFeedback(p => ({ ...p, comment: e.target.value }))}
                />
                <Button size="sm" onClick={handleSubmitFeedback}>Submit Feedback</Button>
              </>
            )}
          </Card>
        )}
      </div>
    </PageLayout>
  );
};

export default OrderTrackingPage;
