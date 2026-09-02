import React, { useState, useEffect } from 'react';
import PageLayout from '../../components/layout/PageLayout';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import { useApi } from '../../hooks/useApi';
import { useSocket } from '../../hooks/useSocket';
import { menuService } from '../../services/menu.service';
import toast from 'react-hot-toast';

const InventoryPage = () => {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const { loading, execute: fetchItems } = useApi(menuService.getItems);
  const { on, off } = useSocket();

  useEffect(() => {
    fetchItems().then(data => {
      if (data) setItems(data);
    });
  }, [fetchItems]);

  useEffect(() => {
    const handleAvailability = (data) => {
      setItems(prev => prev.map(item => 
        item._id === data.itemId ? { ...item, availability: data.availability } : item
      ));
    };
    on('item:availability_changed', handleAvailability);
    return () => off('item:availability_changed', handleAvailability);
  }, [on, off]);

  const handleUpdate = async (id, newAvailability) => {
    // Optimistic update
    const previousItems = [...items];
    setItems(prev => prev.map(item => item._id === id ? { ...item, availability: newAvailability } : item));
    
    try {
      await menuService.updateAvailability(id, newAvailability);
      toast.success('Availability updated');
    } catch (err) {
      toast.error('Failed to update');
      setItems(previousItems);
    }
  };

  const filteredItems = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));

  // Group by category
  const grouped = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  return (
    <PageLayout title="Inventory Status">
      <Card className="mb-6">
        <Input 
          placeholder="Search items..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Card>

      {loading ? (
        <div className="text-center py-12">Loading inventory...</div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([category, catItems]) => (
            <div key={category}>
              <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b-2 border-gray-100">{category}</h3>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden divide-y divide-gray-100">
                {catItems.map(item => (
                  <div key={item._id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${item.availability === 'available' ? 'bg-green-500' : item.availability === 'out_of_stock' ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
                      <span className="font-semibold text-gray-900">{item.name}</span>
                    </div>
                    
                    <div className="flex bg-gray-100 rounded-lg p-1 self-start sm:self-auto">
                      {[
                        { val: 'available', label: 'Available', active: 'bg-white text-green-700 shadow border-green-200' },
                        { val: 'temporarily_unavailable', label: 'Temp. Unavail', active: 'bg-white text-yellow-700 shadow border-yellow-200' },
                        { val: 'out_of_stock', label: 'Out of Stock', active: 'bg-white text-red-700 shadow border-red-200' }
                      ].map(opt => (
                        <button
                          key={opt.val}
                          onClick={() => item.availability !== opt.val && handleUpdate(item._id, opt.val)}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-md border border-transparent transition-all ${
                            item.availability === opt.val ? opt.active : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </PageLayout>
  );
};

export default InventoryPage;
