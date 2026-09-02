import React from 'react';
import MenuCard from './MenuCard';
import SkeletonCard from '../ui/SkeletonCard';
import EmptyState from '../ui/EmptyState';

const MenuGrid = ({ items, loading, onCardClick, onAdd }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <EmptyState 
        icon="🍽"
        title="No items found"
        description="Try adjusting your search or filters to find what you're looking for."
      />
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {items.map(item => (
        <MenuCard 
          key={item._id} 
          item={item} 
          onClick={onCardClick}
          onAdd={onAdd}
        />
      ))}
    </div>
  );
};

export default MenuGrid;
