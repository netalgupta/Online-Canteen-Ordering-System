import React from 'react';
import { Plus } from 'lucide-react';
import { CATEGORY_EMOJIS } from '../../utils/constants';

const MenuCard = ({ item, onClick, onAdd }) => {
  const isAvailable = item.availability === 'available';
  const categoryName = typeof item.category === 'object' ? item.category?.name : item.category;
  const emoji = CATEGORY_EMOJIS[categoryName] || CATEGORY_EMOJIS['default'];

  return (
    <div 
      className={`queue-food-card card overflow-hidden group flex flex-col relative h-full ${
        isAvailable ? 'hover:shadow-md cursor-pointer border-b-2 border-b-primary-600' : 'opacity-75'
      }`}
      onClick={() => isAvailable && onClick && onClick(item)}
    >
      {/* Top Banner */}
      <div className="h-28 bg-primary-50 flex items-center justify-center text-4xl relative">
        {item.image ? (
          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <span>{emoji}</span>
        )}
        
        {/* Availability Dot */}
        <div className={`absolute top-3 right-3 w-2.5 h-2.5 rounded-full ring-2 ring-white ${
          isAvailable ? 'bg-green-500' : 'bg-red-500'
        }`} />

        {!isAvailable && (
          <div className="absolute inset-0 bg-gray-500/50 flex items-center justify-center backdrop-blur-sm">
            <span className="bg-white text-gray-800 text-xs font-bold px-2 py-1 rounded shadow-sm">
              {item.availability === 'out_of_stock' ? 'Out of Stock' : 'Unavailable'}
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-1">
          <h4 className="font-bold text-gray-800 text-base line-clamp-1">{item.name}</h4>
          <span className="font-bold text-primary-600">₹{item.price}</span>
        </div>
        <p className="text-xs text-gray-400 mb-3 uppercase tracking-wider">{categoryName}</p>
        
        {/* Footer */}
        <div className="mt-auto flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${item.isVeg ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-xs text-gray-500">{item.preparationTime} min</span>
          </div>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              isAvailable && onAdd && onAdd(item);
            }}
            disabled={!isAvailable}
            className={`px-3 py-1 text-xs font-bold rounded transition-colors ${
              isAvailable 
                ? 'bg-primary-600 text-white hover:bg-primary-700' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            ADD
          </button>
        </div>
      </div>
    </div>
  );
};

export default MenuCard;
