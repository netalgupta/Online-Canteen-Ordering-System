import React from 'react';

const Card = ({ children, className = '', hover = false, padding = 'p-4' }) => {
  return (
    <div className={`bg-white rounded border border-gray-200 shadow-sm ${padding} ${hover ? 'hover:shadow-md transition-shadow cursor-pointer' : ''} ${className}`}>
      {children}
    </div>
  );
};

export default Card;
