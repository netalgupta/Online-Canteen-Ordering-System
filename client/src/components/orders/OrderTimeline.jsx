import React from 'react';
import { Check } from 'lucide-react';
import { formatTime } from '../../utils/time';

const OrderTimeline = ({ order }) => {
  const standardSteps = ['placed', 'received', 'accepted', 'preparing', 'ready', 'collected'];
  const history = order.statusHistory || [];
  
  const currentStatus = order.status;
  const isTerminal = ['rejected', 'cancelled', 'expired'].includes(currentStatus);
  
  // Determine which steps to show
  let steps = [...standardSteps];
  if (isTerminal) {
    const termIndex = history.findIndex(h => h.status === currentStatus);
    if (termIndex !== -1) {
      // Find the last good status before it failed
      const lastGoodIdx = standardSteps.indexOf(history[termIndex - 1]?.status);
      if (lastGoodIdx !== -1) {
        steps = [...standardSteps.slice(0, lastGoodIdx + 1), currentStatus];
      } else {
        steps = ['placed', currentStatus];
      }
    } else {
      steps = ['placed', currentStatus];
    }
  }

  const getHistoryEntry = (step) => history.find(h => h.status === step);
  const getCurrentStepIndex = () => steps.indexOf(currentStatus);
  
  const currentIdx = getCurrentStepIndex();

  const getStepLabels = (step) => {
    const labels = {
      placed: 'Order Placed',
      received: 'Received by Kitchen',
      accepted: 'Accepted',
      preparing: 'Preparing',
      ready: 'Ready for Pickup',
      collected: 'Collected',
      rejected: 'Order Rejected',
      cancelled: 'Cancelled',
      expired: 'Expired'
    };
    return labels[step] || step;
  };

  return (
    <div className="py-4">
      <div className="relative pl-4 border-l-2 border-gray-100 space-y-6">
        {steps.map((step, index) => {
          const entry = getHistoryEntry(step);
          const isCompleted = index < currentIdx || entry;
          const isCurrent = index === currentIdx;
          const isFailedStep = ['rejected', 'cancelled', 'expired'].includes(step);

          return (
            <div key={step} className="relative">
              <div className={`absolute -left-[25px] w-5 h-5 rounded-full flex items-center justify-center
                ${isCompleted && !isFailedStep && !isCurrent ? 'bg-green-500 text-white' : ''}
                ${isCurrent && !isFailedStep ? 'bg-primary-600 text-white animate-pulse' : ''}
                ${isFailedStep ? 'bg-red-500 text-white' : ''}
                ${!isCompleted && !isCurrent ? 'bg-gray-200' : ''}
              `}>
                {(isCompleted && !isCurrent && !isFailedStep) ? <Check className="w-3 h-3" /> : null}
                {isFailedStep ? <span className="text-[10px] font-bold">✕</span> : null}
                {(isCurrent && !isFailedStep) ? <span className="w-2 h-2 bg-white rounded-full"></span> : null}
              </div>
              
              <div className="pl-2">
                <h4 className={`text-sm font-semibold ${isCurrent ? (isFailedStep ? 'text-red-600' : 'text-primary-600') : (isCompleted ? 'text-gray-900' : 'text-gray-400')}`}>
                  {getStepLabels(step)}
                </h4>
                {entry && <p className="text-xs text-gray-500">{formatTime(entry.timestamp)}</p>}
                {isFailedStep && order.rejectionReason && (
                  <p className="text-xs text-red-500 mt-1">Reason: {order.rejectionReason}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrderTimeline;
