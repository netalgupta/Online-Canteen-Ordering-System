import React, { useEffect, useState } from 'react';
import PageLayout from '../../components/layout/PageLayout';
import Sidebar from '../../components/layout/Sidebar';
import MetricCard from '../../components/admin/MetricCard';
import OrdersHourChart from '../../components/admin/OrdersHourChart';
import PopularItemsChart from '../../components/admin/PopularItemsChart';
import { adminService } from '../../services/admin.service';
import OrderStatusBadge from '../../components/orders/OrderStatusBadge';
import { formatTime } from '../../utils/time';
import { ShoppingBag, DollarSign, Activity, TrendingUp, Clock, CheckCircle, XCircle } from 'lucide-react';

const AdminDashboardPage = () => {
  const [data, setData] = useState({
    overview: null,
    hourly: [],
    popular: [],
    performance: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [overview, hourly, popular, performance] = await Promise.all([
          adminService.getOverview(),
          adminService.getHourlyData(),
          adminService.getPopularItems(),
          adminService.getPerformance()
        ]);
        setData({ overview, hourly, popular, performance });
      } catch (err) {
        console.error('Failed to load analytics', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-8 text-center">Loading dashboard...</div>;

  const { overview, hourly, popular, performance } = data;

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 overflow-x-hidden">
        <PageLayout title="Dashboard Overview" subtitle="Real-time analytics and performance metrics">
          
          {/* Top Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <MetricCard 
              icon={ShoppingBag} 
              title="Today's Orders" 
              value={overview?.totalOrders || 0} 
              colorClass="bg-blue-50 text-blue-600"
            />
            <MetricCard 
              icon={DollarSign} 
              title="Today's Revenue" 
              value={`₹${overview?.totalRevenue || 0}`} 
              colorClass="bg-green-50 text-green-600"
            />
            <MetricCard 
              icon={Activity} 
              title="Avg Order Value" 
              value={`₹${overview?.averageOrderValue || 0}`} 
              colorClass="bg-purple-50 text-purple-600"
            />
            <MetricCard 
              icon={TrendingUp} 
              title="Completed Orders" 
              value={overview?.completedOrders || 0} 
              colorClass="bg-primary-50 text-primary-600"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2">
              <OrdersHourChart data={hourly} />
            </div>
            <div>
              <PopularItemsChart data={popular} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
              <p className="text-sm text-gray-500 mb-1 font-medium">Avg Wait Time</p>
              <p className="text-2xl font-bold text-gray-900">{performance?.avgWaitTime || 0} min</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
              <p className="text-sm text-gray-500 mb-1 font-medium">Avg Prep Time</p>
              <p className="text-2xl font-bold text-gray-900">{performance?.avgPrepTime || 0} min</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
              <p className="text-sm text-gray-500 mb-1 font-medium">Avg Total Time</p>
              <p className="text-2xl font-bold text-gray-900">{performance?.avgTotalTime || 0} min</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
              <p className="text-sm text-gray-500 mb-1 font-medium">Peak Hour</p>
              <p className="text-2xl font-bold text-gray-900">{performance?.peakHour || '-'}</p>
            </div>
          </div>

        </PageLayout>
      </main>
    </div>
  );
};

export default AdminDashboardPage;
