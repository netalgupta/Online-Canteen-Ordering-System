import React from 'react';
import Card from '../ui/Card';
import { formatIST } from '../../utils/time';
import { HEAT_CONFIG } from '../../utils/constants';

const QueueStatus = ({ queuePosition, estimatedWaitTime, estimatedReadyTime, heat = 'low' }) => {
  const config = HEAT_CONFIG[heat] || HEAT_CONFIG.low;

  return (
    <Card className="text-center overflow-hidden">
      <div className={`${config.bg} p-2 border-b ${config.border} flex justify-center items-center gap-2`}>
        <span>{config.emoji}</span>
        <span className={`text-xs font-semibold ${config.color} uppercase tracking-wider`}>
          Queue Heat: {config.label}
        </span>
      </div>
      
      <div className="p-4 grid grid-cols-2 gap-4 divide-x divide-gray-100">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Queue Position</p>
          <p className="text-3xl font-bold text-gray-900">#{queuePosition || '-'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Est. Wait</p>
          <p className="text-3xl font-bold text-gray-900">{estimatedWaitTime ? `${estimatedWaitTime}m` : '-'}</p>
        </div>
      </div>
      
      {estimatedReadyTime && (
        <div className="bg-gray-50 p-3 text-sm">
          <span className="text-gray-500">Estimated Ready: </span>
          <span className="font-semibold text-gray-900">{formatIST(estimatedReadyTime)}</span>
        </div>
      )}
      
      <div className="p-2 text-[10px] text-gray-400">
        *Estimated time may vary based on kitchen workload
      </div>
    </Card>
  );
};

export default QueueStatus;
