import React from 'react';
import { STATUS_COLORS, STATUS_LABELS } from '../../utils/constants';
import { Check, Clock, Bell, XCircle, AlertCircle } from 'lucide-react';

const OrderStatusBadge = ({ status }) => {
  const colorClass = STATUS_COLORS[status] || STATUS_COLORS.placed;
  const label = STATUS_LABELS[status] || status;
  
  const getIcon = () => {
    switch(status) {
      case 'collected': return <Check className="w-3 h-3 mr-1" />;
      case 'preparing': return <Clock className="w-3 h-3 mr-1" />;
      case 'ready': return <Bell className="w-3 h-3 mr-1" />;
      case 'rejected':
      case 'cancelled': return <XCircle className="w-3 h-3 mr-1" />;
      case 'expired': return <AlertCircle className="w-3 h-3 mr-1" />;
      default: return null;
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${colorClass}`}>
      {getIcon()}
      {label}
    </span>
  );
};

export default OrderStatusBadge;
