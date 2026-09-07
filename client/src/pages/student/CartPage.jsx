import React from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../../components/layout/PageLayout';
import { useCart } from '../../hooks/useCart';
import CartItem from '../../components/cart/CartItem';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';

const CartPage = () => {
  const { items, getTotal, clearCart } = useCart();
  const { subtotal, itemCount } = getTotal();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <PageLayout title="Your Cart" breadcrumb="Cart">
        <EmptyState 
          icon="🛒"
          title="Your cart is empty"
          description="Looks like you haven't added any items yet."
          action={<Button onClick={() => navigate('/menu')}>Browse Menu</Button>}
        />
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Your Cart" breadcrumb="Cart">
      <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-4">
          <div className="card p-6 divide-y divide-gray-100">
            {items.map((item) => (
              <CartItem key={item.foodItem._id} item={item} />
            ))}
          </div>
          <div className="flex justify-between mt-4">
            <Button variant="ghost" onClick={() => navigate('/menu')}>← Continue Shopping</Button>
            <Button variant="ghost" className="text-red-600 hover:text-red-700" onClick={clearCart}>Clear Cart</Button>
          </div>
        </div>
        
        <div className="md:col-span-1">
          <div className="card p-6 sticky top-24">
            <h3 className="font-bold text-lg text-gray-900 mb-4 border-b pb-4">Order Summary</h3>
            <div className="flex justify-between items-center mb-6">
              <span className="text-gray-600 font-medium">Subtotal ({itemCount} items)</span>
              <span className="text-2xl font-bold text-primary-600">₹{subtotal}</span>
            </div>
            <Button size="lg" fullWidth onClick={() => navigate('/checkout')}>
              Proceed to Checkout
            </Button>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default CartPage;
