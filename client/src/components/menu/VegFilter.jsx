import React from 'react';

const VegFilter = ({ isVegOnly, onChange }) => {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-gray-700">Veg Only</span>
      <button
        onClick={() => onChange(!isVegOnly)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 ${
          isVegOnly ? 'bg-green-500' : 'bg-gray-200'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            isVegOnly ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
};

export default VegFilter;
