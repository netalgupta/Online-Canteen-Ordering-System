import React from 'react';

const MetricCard = ({ icon: Icon, title, value, subtitle, colorClass = "text-primary-600 bg-primary-50", trend }) => {
  return (
    <div className="card p-5 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-full ${colorClass}`}>
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <span className={`text-xs font-bold px-2 py-1 rounded-full ${trend > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div>
        <h4 className="text-3xl font-bold text-gray-800">{value}</h4>
        <p className="text-sm font-medium text-gray-500 mt-1">{title}</p>
      </div>
      {subtitle && (
        <div className="mt-4 text-xs text-gray-400 border-t border-gray-100 pt-3">
          {subtitle}
        </div>
      )}
    </div>
  );
};

export default MetricCard;
