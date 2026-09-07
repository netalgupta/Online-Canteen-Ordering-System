import React, { useState, useEffect } from 'react';
import PageLayout from '../../components/layout/PageLayout';
import { useSearchParams } from 'react-router-dom';
import SearchBar from '../../components/menu/SearchBar';
import VegFilter from '../../components/menu/VegFilter';
import CategoryTabs from '../../components/menu/CategoryTabs';
import MenuGrid from '../../components/menu/MenuGrid';
import FoodItemModal from '../../components/menu/FoodItemModal';
import { menuService } from '../../services/menu.service';
import { useApi } from '../../hooks/useApi';
import { useSocket } from '../../hooks/useSocket';
import { ArrowDownUp } from 'lucide-react';

const MenuPage = () => {
  const [searchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'All');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [isVegOnly, setIsVegOnly] = useState(false);
  const [sortBy, setSortBy] = useState('popular');
  
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalOpen, setModalOpen] = useState(false);
  
  const [items, setItems] = useState([]);

  const { data: categories = [], execute: fetchCategories } = useApi(menuService.getCategories);
  const { loading, execute: fetchItems } = useApi(menuService.getItems);

  const { on, off } = useSocket();

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    const loadItems = async () => {
      const params = {};
      if (selectedCategory !== 'All') params.category = selectedCategory;
      if (searchQuery) params.search = searchQuery;
      if (isVegOnly) params.isVeg = true;
      
      const data = await fetchItems(params);
      if (data) setItems(data);
    };
    loadItems();
  }, [selectedCategory, searchQuery, isVegOnly, fetchItems]);

  useEffect(() => {
    const handleAvailability = (data) => {
      setItems(prev => prev.map(item => 
        item._id === data.itemId ? { ...item, availability: data.availability } : item
      ));
      if (selectedItem && selectedItem._id === data.itemId) {
        setSelectedItem(prev => ({ ...prev, availability: data.availability }));
      }
    };
    
    on('item:availability_changed', handleAvailability);
    return () => off('item:availability_changed', handleAvailability);
  }, [on, off, selectedItem]);

  const handleCardClick = (item) => {
    setSelectedItem(item);
    setModalOpen(true);
  };

  const sortedItems = [...items].sort((first, second) => {
    if (sortBy === 'price-asc') return first.price - second.price;
    if (sortBy === 'price-desc') return second.price - first.price;
    if (sortBy === 'prep-asc') return first.preparationTime - second.preparationTime;
    return Number(second.isPopular) - Number(first.isPopular);
  });

  return (
    <PageLayout title="Full Menu" subtitle="Prep time shown on every item, so there are no surprises at checkout." breadcrumb="Menu">
      <div className="student-toolbar">
        <div className="student-search"><SearchBar onSearch={setSearchQuery} /></div>
        <VegFilter isVegOnly={isVegOnly} onChange={setIsVegOnly} />
        <label className="student-sort" title="Sort menu items">
          <ArrowDownUp className="h-4 w-4" />
          <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} aria-label="Sort menu">
            <option value="popular">Popular</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="prep-asc">Fastest Prep</option>
          </select>
        </label>
      </div>

      <div className="mb-6">
        <CategoryTabs 
          categories={categories} 
          selectedCategory={selectedCategory} 
          onSelect={setSelectedCategory} 
        />
      </div>

      <MenuGrid 
        items={sortedItems} 
        loading={loading} 
        onCardClick={handleCardClick}
      />

      <FoodItemModal 
        item={selectedItem} 
        isOpen={isModalOpen} 
        onClose={() => { setModalOpen(false); setTimeout(() => setSelectedItem(null), 300); }} 
      />
    </PageLayout>
  );
};

export default MenuPage;
