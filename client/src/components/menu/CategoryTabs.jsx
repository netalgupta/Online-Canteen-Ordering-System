import React from 'react';

const CategoryTabs = ({ categories, selectedCategory, onSelect }) => {
  return (
    <div className="w-full overflow-x-auto no-scrollbar py-2 mb-5 sticky top-16 bg-content z-30">
      <div className="flex gap-2 min-w-max px-1">
        <button
          onClick={() => onSelect('All')}
          className={`category-chip transition-colors ${
            selectedCategory === 'All' 
              ? 'active' 
              : ''
          }`}
        >
          All Items
        </button>
        {(categories || []).map((cat) => (
          <button
            key={cat._id || cat.name}
            onClick={() => onSelect(cat.name)}
            className={`category-chip transition-colors ${
              selectedCategory === cat.name 
                ? 'active' 
                : ''
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
