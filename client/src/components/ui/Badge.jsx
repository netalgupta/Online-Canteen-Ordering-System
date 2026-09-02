import React from 'react';

const Badge = ({ status, variant = 'status', text }) => {
  if (variant === 'veg') {
    const isVeg = text.toLowerCase() === 'veg';
    return (
      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${isVeg ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${isVeg ? 'bg-green-500' : 'bg-red-500'}`}></span>
        {text}
      </span>
    );
  }

  if (variant === 'availability') {
    const colors = {
      available: 'bg-green-100 text-green-800',
      temporarily_unavailable: 'bg-yellow-100 text-yellow-800',
      out_of_stock: 'bg-red-100 text-red-800'
    };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] || colors.available}`}>
        {text}
      </span>
    );
  }

  const statusColors = {
    placed: 'bg-gray-100 text-gray-800',
    received: 'bg-blue-100 text-blue-800',
    accepted: 'bg-indigo-100 text-indigo-800',
    preparing: 'bg-amber-100 text-amber-800',
    ready: 'bg-green-100 text-green-800',
    collected: 'bg-gray-200 text-gray-600',
    rejected: 'bg-red-100 text-red-800',
    cancelled: 'bg-red-100 text-red-800',
    expired: 'bg-orange-100 text-orange-800'
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
      {text || status}
    </span>
  );
};

export default Badge;
