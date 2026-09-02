import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDateTime } from '../../utils/time';
import OrderStatusBadge from './OrderStatusBadge';
import Button from '../ui/Button';
import Card from '../ui/Card';

const OrderCard = ({ order, onReorder }) => {
  const navigate = useNavigate();
  const { _id, orderNumber, status, createdAt, items, totalAmount } = order;
  
  const isCollected = status === 'collected';
  const isTerminal = ['collected', 'rejected', 'cancelled', 'expired'].includes(status);
  
  const itemText = items.map(i => `${i.foodItem?.name || 'Item'} × ${i.quantity}`).join(', ');
  const truncatedItems = itemText.length > 40 ? itemText.substring(0, 40) + '...' : itemText;

  return (
    <Card className="flex flex-col h-full" hover onClick={() => navigate(`/order/${_id}`)}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="font-bold text-gray-900 text-lg">ORDER #{orderNumber}</h4>
          <p className="text-sm text-gray-500">{formatDateTime(createdAt)}</p>
        </div>
        <OrderStatusBadge status={status} />
      </div>
      
      <div className="text-sm text-gray-700 mb-4 flex-1">
        <p className="line-clamp-2">{truncatedItems}</p>
      </div>
      
      <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
        <span className="font-bold text-gray-900">₹{totalAmount}</span>
        
        <div className="flex gap-2" onClick={e => e.stopPropagation()}>
          {!isTerminal && (
            <Button size="sm" onClick={() => navigate(`/order/${_id}`)}>
              Track Order
            </Button>
          )}
          {isCollected && (
            <Button size="sm" variant="secondary" onClick={() => onReorder && onReorder(_id)}>
              Order Again
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

export default OrderCard;
