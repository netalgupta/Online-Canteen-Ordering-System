import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import PageLayout from "../../components/layout/PageLayout";
import StatusLane from "../../components/staff/StatusLane";
import StaffOrderCard from "../../components/staff/StaffOrderCard";
import { useSocket } from "../../hooks/useSocket";
import { staffService } from "../../services/staff.service";
import { HEAT_CONFIG } from "../../utils/constants";
import toast from "react-hot-toast";

const StaffDashboardPage = () => {
  const [orders, setOrders] = useState([]);
  const [heat, setHeat] = useState(null);
  const [loading, setLoading] = useState(true);
  const { on, off } = useSocket();
  const [activeTab, setActiveTab] = useState("received");

  const fetchOrders = async () => {
    try {
      const data = await staffService.getOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const fetchHeat = async () => {
    try {
      const data = await staffService.getQueueHeat();
      setHeat(data);
    } catch { /* silent */ }
  };

  useEffect(() => {
    fetchOrders();
    fetchHeat();
  }, []);

  useEffect(() => {
    const handleNewOrder = (order) => {
      setOrders(prev => {
        const exists = prev.some(o => o._id === order._id);
        return exists ? prev : [order, ...prev];
      });
      toast.success(`New order ${order.orderNumber} received!`);
    };
    const handleStatusChanged = (updatedOrder) => {
      setOrders(prev => prev.map(o => o._id === updatedOrder._id ? updatedOrder : o));
    };
    const handleHeatChanged = (data) => setHeat(data);

    on("order:new", handleNewOrder);
    on("order:status_changed", handleStatusChanged);
    on("queue:heat_changed", handleHeatChanged);
    return () => {
      off("order:new", handleNewOrder);
      off("order:status_changed", handleStatusChanged);
      off("queue:heat_changed", handleHeatChanged);
    };
  }, [on, off]);

  const handleStatusChange = async (orderId, newStatus, reason) => {
    try {
      const updated = await staffService.updateOrderStatus(orderId, newStatus, reason);
      setOrders(prev => prev.map(o => o._id === orderId ? (updated || { ...o, status: newStatus }) : o));
      toast.success(`Order moved to ${newStatus}`);
    } catch {
      toast.error("Failed to update status");
      fetchOrders();
    }
  };

  const getByStatus = (status) =>
    orders.filter(o => o.status === status).sort((a, b) => new Date(a.placedAt) - new Date(b.placedAt));

  const columns = [
    { id: "received",  title: "Incoming",  colorClass: "border-b-red-500 text-red-700 bg-red-50" },
    { id: "accepted",  title: "Accepted",  colorClass: "border-b-blue-500 text-blue-700 bg-blue-50" },
    { id: "preparing", title: "Preparing", colorClass: "border-b-amber-500 text-amber-700 bg-amber-50" },
    { id: "ready",     title: "Ready",     colorClass: "border-b-green-500 text-green-700 bg-green-50" },
  ];

  const heatCfg = heat ? HEAT_CONFIG[heat.heat] : null;

  return (
    <PageLayout title="Live Dashboard">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        {heatCfg && (
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-semibold ${heatCfg.bg} ${heatCfg.border} ${heatCfg.color}`}>
            {heatCfg.emoji} Kitchen load: {heatCfg.label}
            {heat?.activeCount !== undefined && <span className="ml-2 font-normal">({heat.activeCount} active)</span>}
          </div>
        )}
        <div className="flex gap-2">
          <Link to="/staff/kitchen" className="px-3 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-700">Kitchen View</Link>
          <Link to="/staff/pickup"  className="px-3 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700">Pickup</Link>
        </div>
      </div>

      <div className="flex overflow-x-auto gap-2 mb-4 lg:hidden no-scrollbar">
        {columns.map(col => (
          <button key={col.id} onClick={() => setActiveTab(col.id)}
            className={`px-4 py-2 rounded-full whitespace-nowrap font-bold text-sm transition-colors ${activeTab === col.id ? "bg-gray-900 text-white" : "bg-white text-gray-600 border border-gray-200"}`}>
            {col.title} ({getByStatus(col.id).length})
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100vh-220px)]">
        {columns.map(col => {
          const data = getByStatus(col.id);
          return (
            <div key={col.id} className={`h-full ${activeTab !== col.id ? "hidden lg:block" : "block"}`}>
              <StatusLane title={col.title} count={data.length} colorClass={col.colorClass}>
                {data.map(order => (
                  <StaffOrderCard key={order._id} order={order} onStatusChange={handleStatusChange} />
                ))}
              </StatusLane>
            </div>
          );
        })}
      </div>
    </PageLayout>
  );
};

export default StaffDashboardPage;
