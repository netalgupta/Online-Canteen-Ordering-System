import React, { useState } from 'react';
import PageLayout from '../../components/layout/PageLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { formatTime } from '../../utils/time';
import { CheckCircle, AlertTriangle } from 'lucide-react';

const PickupVerificationPage = () => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [recentVerifications, setRecentVerifications] = useState([]);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!code.trim() || code.length !== 4) return;

    setLoading(true);
    setErrorMsg('');
    setOrderData(null);

    try {
      const { data } = await api.post('/staff/pickup/verify', { pickupCode: code.toUpperCase() });
      setOrderData(data);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Invalid code or error verifying');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCollection = async () => {
    if (!orderData) return;
    setLoading(true);
    try {
      await api.patch(`/staff/orders/${orderData._id}/status`, { status: 'collected' });
      toast.success('Order collected successfully!');
      
      setRecentVerifications(prev => [
        { ...orderData, collectedAt: new Date() },
        ...prev.slice(0, 4) // keep last 5
      ]);
      
      setOrderData(null);
      setCode('');
    } catch (err) {
      toast.error('Failed to confirm collection');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout title="Pickup Verification">
      <div className="max-w-xl mx-auto space-y-6">
        <Card className="text-center p-8 border-2 border-primary-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Enter 4-Digit Pickup Code</h2>
          <form onSubmit={handleVerify}>
            <input
              type="text"
              maxLength={4}
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              className="text-6xl font-mono text-center font-bold text-gray-900 border-b-4 border-gray-300 focus:border-primary-600 focus:outline-none w-48 mb-6 pb-2 uppercase tracking-widest bg-transparent"
              placeholder="----"
              autoFocus
            />
            <Button type="submit" fullWidth size="lg" loading={loading} disabled={code.length !== 4}>
              Verify Code
            </Button>
          </form>

          {errorMsg && (
            <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 justify-center font-medium">
              <AlertTriangle className="w-5 h-5" />
              {errorMsg}
            </div>
          )}
        </Card>

        {orderData && (
          <Card className="border-2 border-green-500 shadow-lg relative overflow-hidden animate-in slide-in-from-bottom-4">
            <div className="absolute top-0 left-0 w-full h-1 bg-green-500"></div>
            <div className="p-2">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-3xl font-black text-gray-900 mb-1">#{orderData.orderNumber}</h3>
                  <p className="text-lg font-medium text-gray-700">{orderData.user?.name}</p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-bold uppercase tracking-wider mb-1">
                    Ready
                  </span>
                  <p className="text-sm text-gray-500 font-medium">{formatTime(orderData.createdAt)}</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 space-y-3 mb-6">
                {orderData.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-lg font-medium">
                    <span>{item.quantity}× {item.foodItem.name}</span>
                  </div>
                ))}
              </div>

              <Button 
                fullWidth 
                size="lg" 
                className="bg-green-600 hover:bg-green-700 h-16 text-xl"
                onClick={handleConfirmCollection}
                loading={loading}
              >
                <CheckCircle className="w-6 h-6 mr-2" /> Confirm Collection
              </Button>
            </div>
          </Card>
        )}

        {recentVerifications.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 px-2">Recent Verifications</h3>
            <div className="space-y-2">
              {recentVerifications.map(v => (
                <div key={v._id} className="bg-white p-3 rounded-lg border border-gray-100 flex justify-between items-center opacity-70">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="font-bold text-gray-900">#{v.orderNumber}</span>
                    <span className="text-gray-600 text-sm">{v.user?.name}</span>
                  </div>
                  <span className="text-xs text-gray-400">{formatTime(v.collectedAt)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default PickupVerificationPage;
