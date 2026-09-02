import React from 'react';

const CategoryTabs = ({ categories, selectedCategory, onSelect }) => {
  return (
    <div className="w-full overflow-x-auto no-scrollbar py-2 border-b border-gray-200 mb-6 sticky top-16 bg-canteen-bg z-30">
      <div className="flex space-x-2 min-w-max px-4">
        <button
          onClick={() => onSelect('All')}
          className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
            selectedCategory === 'All' 
              ? 'bg-primary-600 text-white shadow-sm' 
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          All Items
        </button>
        {categories.map((cat) => (
          <button
            key={cat._id || cat.name}
            onClick={() => onSelect(cat.name)}
            className={`px-4 py-2 text-sm font-medium rounded-full transition-colors whitespace-nowrap ${
              selectedCategory === cat.name 
                ? 'bg-primary-600 text-white shadow-sm' 
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
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
