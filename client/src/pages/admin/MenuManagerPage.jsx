import React, { useState, useEffect } from 'react';
import PageLayout from '../../components/layout/PageLayout';
import Sidebar from '../../components/layout/Sidebar';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { menuService } from '../../services/menu.service';
import toast from 'react-hot-toast';
import Badge from '../../components/ui/Badge';
import { Edit2, Trash2, Plus } from 'lucide-react';

const MenuManagerPage = () => {
  const [activeTab, setActiveTab] = useState('items'); // 'categories' or 'items'
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '', description: '', category: '', price: '', 
    isVeg: true, preparationTime: '', availability: 'available', isPopular: false
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [itemsData, catsData] = await Promise.all([
        menuService.getItems(),
        menuService.getCategories()
      ]);
      setItems(itemsData);
      setCategories(catsData);
    } catch (err) {
      toast.error('Failed to load menu data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name, description: item.description || '', category: item.category,
        price: item.price, isVeg: item.isVeg, preparationTime: item.preparationTime,
        availability: item.availability, isPopular: item.isPopular || false
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: '', description: '', category: categories[0]?.name || '', price: '', 
        isVeg: true, preparationTime: '', availability: 'available', isPopular: false
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await menuService.updateItem(editingItem._id, formData);
        toast.success('Item updated successfully');
      } else {
        await menuService.createItem(formData);
        toast.success('Item created successfully');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error('Failed to save item');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await menuService.deleteItem(id);
        toast.success('Item deleted');
        fetchData();
      } catch (err) {
        toast.error('Failed to delete item');
      }
    }
  };

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 overflow-x-hidden">
        <PageLayout 
          title="Menu Manager" 
          actions={
            <Button onClick={() => handleOpenModal()} className="flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Item
            </Button>
          }
        >
          <div className="mb-6 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('items')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'items'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Food Items
              </button>
              <button
                onClick={() => setActiveTab('categories')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'categories'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Categories
              </button>
            </nav>
          </div>

          {activeTab === 'items' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loading ? (
                      <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-500">Loading items...</td></tr>
                    ) : items.map((item) => (
                      <tr key={item._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${item.isVeg ? 'bg-green-500' : 'bg-red-500'}`} />
                            <div className="font-medium text-gray-900">{item.name}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.category}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">₹{item.price}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant="availability" status={item.availability} text={item.availability.replace('_', ' ')} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button onClick={() => handleOpenModal(item)} className="text-blue-600 hover:text-blue-900 mr-3">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(item._id)} className="text-red-600 hover:text-red-900">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'categories' && (
            <div className="p-8 text-center text-gray-500 bg-white rounded-xl shadow-sm border border-gray-200">
              Category management interface (similar table layout)
            </div>
          )}

          <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? 'Edit Item' : 'Add New Item'}>
            <form onSubmit={handleSave} className="space-y-4">
              <Input label="Name" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Price (₹)" type="number" required value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                <Input label="Prep Time (min)" type="number" required value={formData.preparationTime} onChange={e => setFormData({...formData, preparationTime: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select className="w-full border-gray-300 rounded-md shadow-sm p-2 border" required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                  <option value="">Select Category</option>
                  {categories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={formData.isVeg} onChange={e => setFormData({...formData, isVeg: e.target.checked})} className="rounded text-primary-600" />
                  Is Vegetarian
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={formData.isPopular} onChange={e => setFormData({...formData, isPopular: e.target.checked})} className="rounded text-primary-600" />
                  Mark as Popular
                </label>
              </div>
              <div className="pt-4 flex justify-end gap-2 border-t">
                <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit">Save Item</Button>
              </div>
            </form>
          </Modal>

        </PageLayout>
      </main>
    </div>
  );
};

export default MenuManagerPage;
