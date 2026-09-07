import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDateTime } from '../../utils/time';
import OrderStatusBadge from './OrderStatusBadge';
import Button from '../ui/Button';

const OrderCard = ({ order, onReorder }) => {
  const navigate = useNavigate();
  const { _id, orderNumber, status, createdAt, items, totalAmount } = order;
  
  const isCollected = status === 'collected';
  const isTerminal = ['collected', 'rejected', 'cancelled', 'expired'].includes(status);
  
  const itemText = items.map(i => `${i.foodItem?.name || 'Item'} × ${i.quantity}`).join(', ');
  const truncatedItems = itemText.length > 50 ? itemText.substring(0, 50) + '...' : itemText;

  return (
    <div className="bg-white border-b border-gray-200 hover:bg-gray-50 transition-colors p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer" onClick={() => navigate(`/order/${_id}`)}>
      <div className="flex-1">
        <h4 className="font-bold text-gray-900 text-lg">ORDER #{orderNumber}</h4>
        <p className="text-sm text-gray-500 mt-1 line-clamp-1" title={itemText}>{truncatedItems}</p>
      </div>
      
      <div className="flex-1 flex flex-col md:items-center text-left md:text-center">
        <p className="text-sm text-gray-500">{formatDateTime(createdAt)}</p>
        <span className="font-bold text-gray-900 mt-1">₹{totalAmount}</span>
      </div>
      
      <div className="flex-1 flex items-center justify-between md:justify-end gap-4" onClick={e => e.stopPropagation()}>
        <OrderStatusBadge status={status} />
        <div className="flex gap-2">
          {!isTerminal && (
            <Button size="sm" variant="primary" onClick={() => navigate(`/order/${_id}`)}>
              Track
            </Button>
          )}
          {isCollected && (
            <Button size="sm" variant="outline" onClick={() => onReorder && onReorder(_id)}>
              Reorder
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderCard;
