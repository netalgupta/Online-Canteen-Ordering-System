import React from 'react';
import { Check } from 'lucide-react';

const ProgressSteps = ({ steps, currentStep }) => {
  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between relative">
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-0.5 bg-gray-200 z-0"></div>
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          
          return (
            <div key={step} className="relative z-10 flex flex-col items-center group">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors
                ${isCompleted ? 'bg-primary border-primary text-white' : 
                  isCurrent ? 'bg-white border-primary text-primary' : 
                  'bg-white border-gray-300 text-gray-400'}`}>
                {isCompleted ? <Check className="w-4 h-4" /> : <span className="text-sm font-medium">{index + 1}</span>}
              </div>
              <span className={`mt-2 text-xs font-medium absolute -bottom-6 w-20 text-center
                ${isCurrent ? 'text-primary' : isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                {step}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressSteps;
