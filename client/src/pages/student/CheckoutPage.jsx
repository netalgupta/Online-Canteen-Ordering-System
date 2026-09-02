import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../../components/layout/PageLayout';
import ProgressSteps from '../../components/ui/ProgressSteps';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useCart } from '../../hooks/useCart';
import { useApi } from '../../hooks/useApi';
import { orderService } from '../../services/order.service';
import { menuService } from '../../services/menu.service';
import { formatIST } from '../../utils/time';
import toast from 'react-hot-toast';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { items, getTotal, removeItem, updateQuantity, clearCart } = useCart();
  const { subtotal } = getTotal();
  
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [overallInstructions, setOverallInstructions] = useState('');
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  
  const { loading: isPlacing, execute: placeOrder } = useApi(orderService.placeOrder);

  useEffect(() => {
    if (items.length === 0) {
      navigate('/menu');
      return;
    }

    // Fetch slots
    orderService.getSlots(new Date().toISOString().split('T')[0]).then(data => {
      setSlots(data);
    }).catch(console.error);

    // Revalidate cart items asynchronously
    const revalidate = async () => {
      for (const cartItem of items) {
        try {
          const freshItem = await menuService.getItem(cartItem.foodItem._id);
          if (freshItem.availability !== 'available') {
            toast.error(`${freshItem.name} is no longer available and was removed.`);
            removeItem(freshItem._id);
          }
        } catch (e) {
          console.error("Failed to revalidate item", e);
        }
      }
    };
    revalidate();
  }, []);

  const handlePlaceOrder = async () => {
    if (items.length === 0) return;
    
    try {
      const payload = {
        items: items.map(i => ({
          foodItemId: i.foodItem._id,
          quantity: i.quantity,
          specialInstructions: i.specialInstructions || ''
        })),
        pickupSlotId: selectedSlot,
        idempotencyKey,
        specialInstructions: overallInstructions || ''
      };

      const result = await placeOrder(payload);
      clearCart();
      toast.success('Order placed successfully!');
      navigate(`/order/${result._id}`);
      
    } catch (err) {
      // Error is already toasted by useApi
    }
  };

  if (items.length === 0) return null;

  return (
    <PageLayout title="Checkout">
      <div className="max-w-3xl mx-auto">
        <ProgressSteps steps={['Cart', 'Slot', 'Confirm']} currentStep={1} />
        
        <div className="mt-8 space-y-6">
          <Card>
            <h3 className="font-bold text-lg mb-4">Order Summary</h3>
            <div className="space-y-3 divide-y divide-gray-100">
              {items.map((item, idx) => (
                <div key={idx} className="pt-3 first:pt-0 flex justify-between">
                  <div>
                    <span className="font-medium text-gray-900">{item.quantity}× {item.foodItem.name}</span>
                    {item.specialInstructions && (
                      <p className="text-xs text-gray-500 italic mt-0.5">Note: {item.specialInstructions}</p>
                    )}
                  </div>
                  <span className="font-medium text-gray-900">₹{item.foodItem.price * item.quantity}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="font-bold text-lg mb-4">Pickup Time</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <button
                onClick={() => setSelectedSlot(null)}
                className={`p-3 rounded-lg border-2 text-center transition-colors ${
                  selectedSlot === null ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium">ASAP</div>
                <div className="text-xs text-gray-500 mt-1">No specific slot</div>
              </button>
              
              {slots.map(slot => {
                const isFull = slot.currentOrders >= slot.capacity;
                const isSelected = selectedSlot === slot._id;
                
                return (
                  <button
                    key={slot._id}
                    disabled={isFull}
                    onClick={() => setSelectedSlot(slot._id)}
                    className={`p-3 rounded-lg border-2 text-center transition-colors ${
                      isFull ? 'opacity-50 cursor-not-allowed border-gray-100 bg-gray-50' :
                      isSelected ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium">{formatIST(slot.startTime)}</div>
                    <div className={`text-xs mt-1 ${isFull ? 'text-red-500' : 'text-gray-500'}`}>
                      {isFull ? 'Full' : `${slot.capacity - slot.currentOrders} spots`}
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>
          
          <Card>
            <h3 className="font-bold text-lg mb-4">Payment</h3>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center justify-between">
              <span className="font-medium text-gray-900 flex items-center gap-2">
                <span className="text-xl">💵</span> Pay at Counter
              </span>
              <span className="text-sm text-gray-500">Only cash/UPI at counter supported currently</span>
            </div>
          </Card>

          <Card className="bg-gray-50">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium text-gray-900">₹{subtotal}</span>
            </div>
            <div className="flex justify-between items-center mb-6 pt-4 border-t border-gray-200">
              <span className="text-lg font-bold text-gray-900">Total</span>
              <span className="text-2xl font-black text-primary-600">₹{subtotal}</span>
            </div>
            
            <Button 
              size="lg" 
              fullWidth 
              onClick={handlePlaceOrder} 
              loading={isPlacing}
            >
              Place Order
            </Button>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
};

export default CheckoutPage;
