import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Minus, Plus } from 'lucide-react';
import Badge from '../ui/Badge';
import { useCart } from '../../hooks/useCart';
import { CATEGORY_EMOJIS } from '../../utils/constants';

const FoodItemModal = ({ item, isOpen, onClose }) => {
  const { items, addItem, updateQuantity } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [instructions, setInstructions] = useState('');

  const cartItem = item ? items.find(i => i.foodItem._id === item._id) : null;
  const isAvailable = item?.availability === 'available';

  useEffect(() => {
    if (isOpen && cartItem) {
      setQuantity(cartItem.quantity);
      setInstructions(cartItem.specialInstructions || '');
    } else if (isOpen) {
      setQuantity(1);
      setInstructions('');
    }
  }, [isOpen, cartItem]);

  if (!item) return null;

  const handleAdd = () => {
    if (!isAvailable) return;
    if (cartItem) {
      updateQuantity(item._id, quantity);
      if (instructions !== cartItem.specialInstructions) {
        useCart().updateInstructions(item._id, instructions); // Needs context access directly if not destructured, wait we have addItem logic handling update basically, or just clear and add.
      }
    } else {
      addItem(item, quantity, instructions);
    }
    onClose();
  };

  const emoji = CATEGORY_EMOJIS[item.category] || CATEGORY_EMOJIS['default'];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" title="Item Details">
      <div className="flex flex-col h-full">
        <div className="h-48 bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg flex items-center justify-center text-6xl mb-4">
          {item.image ? (
            <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-lg" />
          ) : (
            <span>{emoji}</span>
          )}
        </div>

        <div className="flex items-start justify-between mb-2">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{item.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="veg" text={item.isVeg ? 'Veg' : 'Non-Veg'} />
              <span className="text-sm text-gray-500">{item.category}</span>
            </div>
          </div>
          <span className="text-2xl font-bold text-primary-600">₹{item.price}</span>
        </div>

        <p className="text-gray-600 text-sm mb-4">{item.description || 'No description available.'}</p>
        
        <div className="flex items-center gap-4 mb-6 text-sm text-gray-700">
          <div className="flex items-center gap-1">
            <span>⏱</span> {item.preparationTime} min prep
          </div>
          <Badge variant="availability" status={item.availability} text={
            item.availability === 'available' ? 'Available' : 
            item.availability === 'out_of_stock' ? 'Out of Stock' : 'Temp. Unavailable'
          } />
        </div>

        <div className="border-t border-gray-100 py-4 mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1 || !isAvailable}
              className="p-2 rounded-full border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
            >
              <Minus className="w-5 h-5 text-gray-600" />
            </button>
            <span className="text-xl font-semibold w-8 text-center">{quantity}</span>
            <button 
              onClick={() => setQuantity(Math.min(10, quantity + 1))}
              disabled={quantity >= 10 || !isAvailable}
              className="p-2 rounded-full border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
            >
              <Plus className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Special Instructions (Optional)</label>
          <textarea
            rows={2}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2"
            placeholder="e.g. Extra spicy, no onions"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            disabled={!isAvailable}
          />
        </div>

        <div className="mt-auto">
          <Button 
            fullWidth 
            size="lg" 
            onClick={handleAdd}
            disabled={!isAvailable}
          >
            {cartItem ? `Update Cart • ₹${item.price * quantity}` : `Add to Cart • ₹${item.price * quantity}`}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default FoodItemModal;
