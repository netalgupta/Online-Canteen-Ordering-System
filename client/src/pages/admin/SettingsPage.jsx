import React, { useState, useEffect } from 'react';
import PageLayout from '../../components/layout/PageLayout';
import Sidebar from '../../components/layout/Sidebar';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { adminService } from '../../services/admin.service';
import toast from 'react-hot-toast';

const SettingsPage = () => {
  const [settings, setSettings] = useState({
    isKitchenOpen: true,
    kitchenCapacity: 50,
    operatingHours: { open: '08:00', close: '21:00' },
    pickupSlots: { durationMinutes: 10, capacityPerSlot: 10 },
    peakHours: { start: '12:00', end: '14:00' }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminService.getSettings().then(data => {
      if (data) setSettings(data);
      setLoading(false);
    }).catch(() => {
      toast.error('Failed to load settings');
      setLoading(false);
    });
  }, []);

  const handleChange = (section, field, value) => {
    setSettings(prev => {
      if (section) {
        return { ...prev, [section]: { ...prev[section], [field]: value } };
      }
      return { ...prev, [field]: value };
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminService.updateSettings(settings);
      toast.success('Settings updated successfully');
    } catch (err) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading settings...</div>;

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 overflow-x-hidden">
        <PageLayout title="System Settings">
          <form onSubmit={handleSave} className="max-w-2xl space-y-6">
            
            <Card>
              <h3 className="font-bold text-lg mb-4 text-gray-900 border-b pb-2">Kitchen Status</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Accepting Orders</p>
                  <p className="text-sm text-gray-500">Toggle whether the canteen is currently open for new orders.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={settings.isKitchenOpen} 
                    onChange={e => handleChange(null, 'isKitchenOpen', e.target.checked)} 
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                </label>
              </div>
            </Card>

            <Card>
              <h3 className="font-bold text-lg mb-4 text-gray-900 border-b pb-2">Operating Hours</h3>
              <div className="grid grid-cols-2 gap-4">
                <Input 
                  label="Opening Time" 
                  type="time" 
                  value={settings.operatingHours?.open || ''} 
                  onChange={e => handleChange('operatingHours', 'open', e.target.value)} 
                />
                <Input 
                  label="Closing Time" 
                  type="time" 
                  value={settings.operatingHours?.close || ''} 
                  onChange={e => handleChange('operatingHours', 'close', e.target.value)} 
                />
              </div>
              <h3 className="font-bold text-sm mt-6 mb-2 text-gray-900">Peak Hours (High Load)</h3>
              <div className="grid grid-cols-2 gap-4">
                <Input 
                  label="Peak Start" 
                  type="time" 
                  value={settings.peakHours?.start || ''} 
                  onChange={e => handleChange('peakHours', 'start', e.target.value)} 
                />
                <Input 
                  label="Peak End" 
                  type="time" 
                  value={settings.peakHours?.end || ''} 
                  onChange={e => handleChange('peakHours', 'end', e.target.value)} 
                />
              </div>
            </Card>

            <Card>
              <h3 className="font-bold text-lg mb-4 text-gray-900 border-b pb-2">Capacity & Slots</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Input 
                  label="Max Kitchen Capacity (Active Orders)" 
                  type="number" 
                  value={settings.kitchenCapacity} 
                  onChange={e => handleChange(null, 'kitchenCapacity', Number(e.target.value))} 
                />
                <Input 
                  label="Slot Duration (Minutes)" 
                  type="number" 
                  value={settings.pickupSlots?.durationMinutes || 10} 
                  onChange={e => handleChange('pickupSlots', 'durationMinutes', Number(e.target.value))} 
                />
                <Input 
                  label="Max Orders Per Slot" 
                  type="number" 
                  value={settings.pickupSlots?.capacityPerSlot || 10} 
                  onChange={e => handleChange('pickupSlots', 'capacityPerSlot', Number(e.target.value))} 
                />
              </div>
            </Card>

            <div className="flex justify-end pt-4">
              <Button type="submit" size="lg" loading={saving}>
                Save Settings
              </Button>
            </div>
            
          </form>
        </PageLayout>
      </main>
    </div>
  );
};

export default SettingsPage;
