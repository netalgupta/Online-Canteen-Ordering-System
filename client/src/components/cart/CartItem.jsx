import React, { useState } from 'react';
import { Minus, Plus, X, Edit2 } from 'lucide-react';
import { useCart } from '../../hooks/useCart';
import Badge from '../ui/Badge';

const CartItem = ({ item }) => {
  const { updateQuantity, removeItem, updateInstructions } = useCart();
  const [isEditingDocs, setIsEditingDocs] = useState(false);
  const [tempInst, setTempInst] = useState(item.specialInstructions || '');
  const { foodItem, quantity, specialInstructions } = item;

  const handleSaveInstructions = () => {
    updateInstructions(foodItem._id, tempInst);
    setIsEditingDocs(false);
  };

  return (
    <div className="flex flex-col gap-3 py-3 border-b border-gray-100 last:border-0 group">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-1.5 mb-1">
            <span className={`w-2 h-2 rounded-full ${foodItem.isVeg ? 'bg-green-500' : 'bg-red-500'}`} />
            <h4 className="font-semibold text-gray-900 leading-tight cursor-pointer hover:text-primary-600 transition-colors" onClick={() => setIsEditingDocs(true)}>
              {foodItem.name}
            </h4>
          </div>
          <p className="text-sm font-medium text-primary-600">₹{foodItem.price} <span className="text-gray-400 font-normal">× {quantity}</span></p>
        </div>
        
        <div className="flex flex-col items-end gap-2">
          <button 
            onClick={() => removeItem(foodItem._id)}
            className="text-gray-300 hover:text-red-500 transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 bg-gray-50 rounded-lg border border-gray-200 p-0.5">
            <button 
              onClick={() => updateQuantity(foodItem._id, quantity - 1)}
              className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded-md transition-colors"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="w-4 text-center text-sm font-medium">{quantity}</span>
            <button 
              onClick={() => updateQuantity(foodItem._id, quantity + 1)}
              disabled={quantity >= 10}
              className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {specialInstructions && !isEditingDocs && (
        <div 
          className="text-xs text-gray-500 italic bg-yellow-50/50 p-2 rounded-md border border-yellow-100 flex justify-between items-start cursor-pointer group/inst"
          onClick={() => setIsEditingDocs(true)}
        >
          <span><span className="text-yellow-600 mr-1 font-bold">⚠</span> {specialInstructions}</span>
          <Edit2 className="w-3 h-3 text-gray-300 group-hover/inst:text-gray-500 mt-0.5" />
        </div>
      )}

      {isEditingDocs && (
        <div className="flex gap-2">
          <input
            type="text"
            value={tempInst}
            onChange={(e) => setTempInst(e.target.value)}
            placeholder="Special instructions (e.g. no onions)"
            className="flex-1 text-xs border border-gray-300 rounded-md px-2 py-1 focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
            autoFocus
          />
          <button 
            onClick={handleSaveInstructions}
            className="text-xs bg-gray-900 text-white px-2 py-1 rounded-md font-medium"
          >
            Save
          </button>
        </div>
      )}
    </div>
  );
};

export default CartItem;
