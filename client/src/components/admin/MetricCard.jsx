import React from 'react';

const MetricCard = ({ icon: Icon, title, value, subtitle, colorClass = "text-primary-600 bg-primary-50" }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg ${colorClass}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <h4 className="text-2xl font-bold text-gray-900">{value}</h4>
        </div>
      </div>
      {subtitle && (
        <div className="mt-3 text-sm text-gray-600 border-t border-gray-100 pt-3">
          {subtitle}
        </div>
      )}
    </div>
  );
};

export default MetricCard;
