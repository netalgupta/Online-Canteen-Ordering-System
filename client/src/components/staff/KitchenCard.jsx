import React, { useState, useEffect } from 'react';

const KitchenCard = ({ order, onStatusChange }) => {
  const [elapsed, setElapsed] = useState('');
  const [isActioning, setIsActioning] = useState(false);
  const { _id, orderNumber, items, status, statusHistory } = order;

  useEffect(() => {
    const acceptedEntry = statusHistory?.find(h => h.status === 'accepted');
    if (!acceptedEntry) return;

    const startTime = new Date(acceptedEntry.timestamp).getTime();
    
    const updateTimer = () => {
      const now = new Date().getTime();
      const diff = Math.floor((now - startTime) / 60000); // in minutes
      setElapsed(diff < 1 ? '< 1 min' : `${diff} min`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, [statusHistory]);

  const handleAction = async (newStatus) => {
    setIsActioning(true);
    try {
      await onStatusChange(_id, newStatus);
    } finally {
      setIsActioning(false);
    }
  };

  const totalPrepTime = items.reduce((max, item) => Math.max(max, item.foodItem?.preparationTime || 0), 0);
  const hasInstructions = items.some(i => i.specialInstructions);

  return (
    <div className={`rounded-xl border-4 shadow-lg flex flex-col h-full bg-white ${
      status === 'preparing' ? 'border-amber-400' : 'border-gray-200'
    }`}>
      <div className={`p-4 border-b-2 flex justify-between items-center ${
        status === 'preparing' ? 'bg-amber-50 text-amber-900 border-amber-200' : 'bg-gray-50 border-gray-200'
      }`}>
        <h2 className="text-4xl font-black">#{orderNumber}</h2>
        <div className="text-right">
          <p className="text-sm font-bold uppercase tracking-wider opacity-70">Accepted</p>
          <p className="text-xl font-bold">{elapsed} ago</p>
        </div>
      </div>

      <div className="p-5 flex-1 bg-white">
        <ul className="space-y-4 mb-4">
          {items.map((item, idx) => (
            <li key={idx} className="flex gap-4 text-2xl font-bold text-gray-900 border-b border-gray-100 pb-2">
              <span className="text-primary-600">{item.quantity}×</span>
              <span>{item.foodItem?.name || 'Item'}</span>
            </li>
          ))}
        </ul>

        {hasInstructions && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 p-3 mb-4 rounded-r">
            <p className="font-bold text-yellow-800 text-lg flex items-start gap-2">
              <span>⚠</span>
              <span>{items.filter(i => i.specialInstructions).map(i => i.specialInstructions).join(' | ')}</span>
            </p>
          </div>
        )}
        
        <p className="text-gray-500 font-medium">Est. Prep: {totalPrepTime} mins</p>
      </div>

      <div className="p-4 bg-gray-50 border-t-2 border-gray-200 mt-auto">
        {status === 'accepted' ? (
          <button
            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-black text-2xl py-6 rounded-lg shadow-md disabled:opacity-50 transition-colors"
            onClick={() => handleAction('preparing')}
            disabled={isActioning}
          >
            ▶ START PREPARING
          </button>
        ) : (
          <button
            className="w-full bg-green-500 hover:bg-green-600 text-white font-black text-2xl py-6 rounded-lg shadow-md disabled:opacity-50 transition-colors"
            onClick={() => handleAction('ready')}
            disabled={isActioning}
          >
            ✓ MARK READY
          </button>
        )}
      </div>
    </div>
  );
};

export default KitchenCard;
