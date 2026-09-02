import React, { useEffect } from 'react';
import PageLayout from '../../components/layout/PageLayout';
import OrderCard from '../../components/orders/OrderCard';
import EmptyState from '../../components/ui/EmptyState';
import { useApi } from '../../hooks/useApi';
import { orderService } from '../../services/order.service';
import { useCart } from '../../hooks/useCart';
import { menuService } from '../../services/menu.service';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const OrderHistoryPage = () => {
  const { data: orders = [], loading, execute: fetchOrders } = useApi(orderService.getMyOrders);
  const { addItem, clearCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleReorder = async (orderId) => {
    const order = orders.find(o => o._id === orderId);
    if (!order) return;
    
    toast.loading('Checking item availability...', { id: 'reorder' });
    
    // Clear existing cart (optional depending on UX preference)
    clearCart();

    let allAvailable = true;
    for (const item of order.items) {
      try {
        const freshItem = await menuService.getItem(item.foodItem._id);
        if (freshItem.availability === 'available') {
          addItem(freshItem, item.quantity, item.specialInstructions);
        } else {
          allAvailable = false;
          toast.error(`${freshItem.name} is not available right now.`, { duration: 4000 });
        }
      } catch (e) {
        allAvailable = false;
      }
    }
    
    toast.dismiss('reorder');
    if (allAvailable) {
      toast.success('Items added to cart!');
    }
    navigate('/checkout');
  };

  return (
    <PageLayout title="My Orders">
      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin text-primary-600">⏳</div></div>
      ) : orders.length === 0 ? (
        <EmptyState 
          icon="🧾"
          title="No orders yet"
          description="You haven't placed any orders. Check out the menu to get started!"
          action={<button onClick={() => navigate('/menu')} className="text-primary-600 font-medium">Browse Menu</button>}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.map(order => (
            <OrderCard key={order._id} order={order} onReorder={handleReorder} />
          ))}
        </div>
      )}
    </PageLayout>
  );
};

export default OrderHistoryPage;
