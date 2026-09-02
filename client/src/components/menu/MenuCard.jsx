import React from 'react';
import { Plus } from 'lucide-react';
import { CATEGORY_EMOJIS } from '../../utils/constants';

const MenuCard = ({ item, onClick, onAdd }) => {
  const isAvailable = item.availability === 'available';
  const emoji = CATEGORY_EMOJIS[item.category] || CATEGORY_EMOJIS['default'];

  return (
    <div 
      className={`relative bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden group ${isAvailable ? 'hover:shadow-md cursor-pointer transition-shadow' : 'opacity-75'}`}
      onClick={() => isAvailable && onClick && onClick(item)}
    >
      <div className="h-32 bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center text-5xl relative">
        {item.image ? (
          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <span>{emoji}</span>
        )}
        
        {!isAvailable && (
          <div className="absolute inset-0 bg-gray-900/40 flex items-center justify-center backdrop-blur-[1px]">
            <span className="bg-white/90 text-gray-800 text-sm font-semibold px-3 py-1 rounded-full shadow-sm">
              {item.availability === 'out_of_stock' ? 'Out of Stock' : 'Unavailable'}
            </span>
          </div>
        )}

        {item.isPopular && isAvailable && (
          <div className="absolute top-2 right-2 bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-1 rounded shadow-sm border border-yellow-200">
            ⭐ Popular
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex justify-between items-start mb-1">
          <div className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${item.isVeg ? 'bg-green-500' : 'bg-red-500'}`} />
            <h4 className="font-semibold text-gray-900 line-clamp-1">{item.name}</h4>
          </div>
        </div>
        
        <p className="text-xs text-gray-500 mb-2">{item.category}</p>
        
        <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
          <span>⏱</span> {item.preparationTime} min prep
        </div>

        <div className="flex items-center justify-between mt-auto">
          <span className="text-lg font-bold text-primary-600">₹{item.price}</span>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              isAvailable && onAdd && onAdd(item);
            }}
            disabled={!isAvailable}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              isAvailable 
                ? 'bg-primary-50 text-primary-600 hover:bg-primary-600 hover:text-white' 
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MenuCard;
