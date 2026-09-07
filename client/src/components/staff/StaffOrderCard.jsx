import React, { useState } from 'react';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { formatRelative, formatTime } from '../../utils/time';

const StaffOrderCard = ({ order, onStatusChange }) => {
  const [isRejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isActioning, setIsActioning] = useState(false);

  const { _id, orderNumber, user, items, status, createdAt, statusHistory } = order;

  const currentStatusEntry = statusHistory?.[statusHistory.length - 1];
  const timeInStatus = currentStatusEntry ? formatRelative(currentStatusEntry.timestamp) : '';

  const handleAction = async (newStatus, data = {}) => {
    setIsActioning(true);
    try {
      await onStatusChange(_id, newStatus, data);
    } finally {
      setIsActioning(false);
      setRejectModalOpen(false);
    }
  };

  const statusColors = {
    received: 'border-l-red-500',
    accepted: 'border-l-blue-500',
    preparing: 'border-l-amber-500',
    ready: 'border-l-green-500',
  };

  const renderActions = () => {
    switch (status) {
      case 'received':
        return (
          <div className="flex gap-2 w-full mt-4">
            <Button 
              className="flex-1 bg-green-600 hover:bg-green-700 font-bold"
              loading={isActioning}
              onClick={() => handleAction('accepted')}
            >
              Accept
            </Button>
            <Button 
              className="flex-1 bg-white border border-red-500 text-red-600 hover:bg-red-50 font-bold"
              onClick={() => setRejectModalOpen(true)}
              disabled={isActioning}
            >
              Reject
            </Button>
          </div>
        );
      case 'accepted':
        return (
          <Button 
            fullWidth className="mt-4 bg-amber-500 hover:bg-amber-600 focus:ring-amber-500 text-white h-10 font-bold"
            loading={isActioning}
            onClick={() => handleAction('preparing')}
          >
            Start Preparing
          </Button>
        );
      case 'preparing':
        return (
          <Button 
            fullWidth className="mt-4 bg-green-500 hover:bg-green-600 focus:ring-green-500 text-white h-10 font-bold"
            loading={isActioning}
            onClick={() => handleAction('ready')}
          >
            Mark Ready
          </Button>
        );
      case 'ready':
        return (
          <Button 
            fullWidth className="mt-4 bg-gray-800 hover:bg-gray-900 focus:ring-gray-800 text-white h-10 font-bold"
            loading={isActioning}
            onClick={() => handleAction('collected')}
          >
            Confirm Collection
          </Button>
        );
      default:
        return null;
    }
  };

  const hasSpecialInstructions = items.some(i => i.specialInstructions);

  return (
    <>
      <div className={`card p-4 flex flex-col mb-3 border-l-4 ${statusColors[status] || 'border-l-gray-300'}`}>
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-xl font-bold text-gray-900">#{orderNumber}</h3>
            <p className="text-sm font-medium text-gray-700">{user?.name || 'Student'}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">{formatTime(createdAt)}</p>
            <p className="text-xs font-bold text-gray-400 mt-0.5">{timeInStatus}</p>
          </div>
        </div>

        <div className="space-y-1 mb-2">
          {items.map((item, idx) => (
            <div key={idx} className="flex justify-between text-sm">
              <span className="font-bold text-gray-900 w-6">{item.quantity}×</span>
              <span className="flex-1 text-gray-700">{item.foodItem?.name || 'Item'}</span>
            </div>
          ))}
        </div>

        {hasSpecialInstructions && (
          <div className="bg-amber-50 border border-amber-200 rounded p-2 mb-2 mt-2">
            <div className="text-xs text-amber-800 font-medium">
              <span className="font-bold mr-1">Note:</span>
              {items.filter(i => i.specialInstructions).map(i => i.specialInstructions).join(' | ')}
            </div>
          </div>
        )}

        {renderActions()}
      </div>

      <Modal isOpen={isRejectModalOpen} onClose={() => setRejectModalOpen(false)} title="Reject Order">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Please provide a reason for rejecting order #{orderNumber}. This will be shown to the student.</p>
          <textarea
            className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-red-500 focus:border-red-500"
            rows={3}
            placeholder="e.g. Items out of stock, kitchen closed..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setRejectModalOpen(false)}>Cancel</Button>
            <Button 
              variant="danger" 
              loading={isActioning}
              disabled={!rejectReason.trim()}
              onClick={() => handleAction('rejected', { reason: rejectReason })}
            >
              Confirm Rejection
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default StaffOrderCard;
