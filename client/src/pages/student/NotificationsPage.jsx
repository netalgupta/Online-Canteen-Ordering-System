import React from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../../components/layout/PageLayout';
import EmptyState from '../../components/ui/EmptyState';
import Button from '../../components/ui/Button';
import { useNotification } from '../../hooks/useNotification';
import { formatRelative } from '../../utils/time';
import { Bell, Info, CheckCircle, AlertTriangle } from 'lucide-react';

const NotificationsPage = () => {
  const { notifications, markRead, markAllRead, unreadCount } = useNotification();
  const navigate = useNavigate();

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      markRead(notification._id);
    }
    if (notification.orderId) {
      navigate(`/order/${notification.orderId}`);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'order_ready': return <CheckCircle className="text-green-500 w-5 h-5" />;
      case 'order_rejected': return <AlertTriangle className="text-red-500 w-5 h-5" />;
      default: return <Info className="text-blue-500 w-5 h-5" />;
    }
  };

  return (
    <PageLayout title="Notifications" breadcrumb="Home > Notifications">
      <div className="flex justify-end mb-4">
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead}>
            Mark all as read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState 
          icon={<Bell className="w-12 h-12 text-gray-300" />}
          title="All caught up!"
          description="You don't have any new notifications."
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="divide-y divide-gray-100">
            {notifications.map(notif => (
              <div 
                key={notif._id}
                onClick={() => handleNotificationClick(notif)}
                className={`p-4 transition-colors cursor-pointer flex gap-4 items-start ${
                  notif.isRead 
                    ? 'bg-white hover:bg-gray-50 text-gray-600' 
                    : 'bg-amber-50 text-gray-900 border-l-4 border-l-amber-500'
                }`}
              >
                <div className="mt-1 flex-shrink-0">
                  {getIcon(notif.type)}
                </div>
                <div className="flex-1">
                  <h4 className={`text-sm ${notif.isRead ? 'font-medium text-gray-700' : 'font-bold text-gray-900'}`}>
                    {notif.title}
                  </h4>
                  <p className={`text-sm mt-0.5 ${notif.isRead ? 'text-gray-500' : 'text-gray-700'}`}>
                    {notif.message}
                  </p>
                  <p className="text-xs text-gray-400 mt-2 font-medium">
                    {formatRelative(notif.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </PageLayout>
  );
};

export default NotificationsPage;
