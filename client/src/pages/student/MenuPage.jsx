import React, { useState, useEffect } from 'react';
import PageLayout from '../../components/layout/PageLayout';
import SearchBar from '../../components/menu/SearchBar';
import VegFilter from '../../components/menu/VegFilter';
import CategoryTabs from '../../components/menu/CategoryTabs';
import MenuGrid from '../../components/menu/MenuGrid';
import FoodItemModal from '../../components/menu/FoodItemModal';
import { menuService } from '../../services/menu.service';
import { useApi } from '../../hooks/useApi';
import { useSocket } from '../../hooks/useSocket';

const MenuPage = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isVegOnly, setIsVegOnly] = useState(false);
  
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

  return (
    <PageLayout title="Menu" subtitle="Pre-order your favorite meals">
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <SearchBar onSearch={setSearchQuery} />
        </div>
        <div className="flex items-center bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm">
          <VegFilter isVegOnly={isVegOnly} onChange={setIsVegOnly} />
        </div>
      </div>

      <CategoryTabs 
        categories={categories} 
        selectedCategory={selectedCategory} 
        onSelect={setSelectedCategory} 
      />

      <MenuGrid 
        items={items} 
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
