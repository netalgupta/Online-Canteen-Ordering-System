import React from 'react';

const StatusLane = ({ title, count, colorClass, children }) => {
  return (
    <div className="flex flex-col h-full bg-gray-100 rounded-xl overflow-hidden shadow-sm">
      <div className={`p-3 border-b-2 flex justify-between items-center bg-white ${colorClass}`}>
        <h3 className="font-bold text-gray-800 uppercase tracking-wide text-sm">{title}</h3>
        <span className="bg-gray-900 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[24px] text-center">
          {count}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-3 no-scrollbar space-y-3">
        {count === 0 ? (
          <div className="h-32 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg text-gray-400 text-sm font-medium">
            No orders
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
};

export default StatusLane;
