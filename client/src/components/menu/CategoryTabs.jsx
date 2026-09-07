import React from 'react';

const CategoryTabs = ({ categories, selectedCategory, onSelect }) => {
  return (
    <div className="w-full overflow-x-auto no-scrollbar py-2 border-b border-gray-200 mb-6 sticky top-16 bg-content z-30">
      <div className="flex space-x-6 min-w-max px-2">
        <button
          onClick={() => onSelect('All')}
          className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
            selectedCategory === 'All' 
              ? 'border-primary-600 text-primary-600 font-bold' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          All Items
        </button>
        {(categories || []).map((cat) => (
          <button
            key={cat._id || cat.name}
            onClick={() => onSelect(cat.name)}
            className={`pb-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
              selectedCategory === cat.name 
                ? 'border-primary-600 text-primary-600 font-bold' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategoryTabs;
