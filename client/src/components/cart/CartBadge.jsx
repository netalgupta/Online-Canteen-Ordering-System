import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '../../hooks/useCart';

const CartBadge = ({ onClick }) => {
  const { getTotal } = useCart();
  const { itemCount } = getTotal();

  return (
    <button 
      onClick={onClick}
      className="relative p-2 hover:bg-primary-700 rounded-full transition-colors group"
    >
      <ShoppingCart className="h-5 w-5 text-white" />
      {itemCount > 0 && (
        <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-primary-600 bg-white rounded-full transform translate-x-1/4 -translate-y-1/4 animate-pulse-ring group-hover:scale-110 transition-transform">
          {itemCount}
        </span>
      )}
    </button>
  );
};

export default CartBadge;
