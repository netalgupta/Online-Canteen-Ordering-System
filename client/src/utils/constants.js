export const ORDER_STATUSES = ['placed','received','accepted','preparing','ready','collected','rejected','cancelled','expired'];
export const ACTIVE_STATUSES = ['placed','received','accepted','preparing'];
export const STATUS_LABELS = {
  placed: 'Order Placed', received: 'Received', accepted: 'Accepted',
  preparing: 'Preparing', ready: 'Ready for Pickup', collected: 'Collected',
  rejected: 'Rejected', cancelled: 'Cancelled', expired: 'Expired'
};
export const STATUS_COLORS = {
  placed: 'bg-gray-100 text-gray-700', received: 'bg-blue-100 text-blue-700',
  accepted: 'bg-indigo-100 text-indigo-700', preparing: 'bg-amber-100 text-amber-700',
  ready: 'bg-green-100 text-green-700', collected: 'bg-gray-100 text-gray-500',
  rejected: 'bg-red-100 text-red-700', cancelled: 'bg-red-100 text-red-700',
  expired: 'bg-orange-100 text-orange-700'
};
export const CATEGORY_EMOJIS = {
  'Hot Items': '🍵', 'Snacks': '🥪', 'Sandwiches': '🥙', 'Dosa': '🫓',
  'Uttappa': '🥞', 'Lunch': '🍱', 'Rice Specials': '🍚', 'Soups': '🍲',
  'Chaat': '🌮', 'Grilled Sandwiches': '🥗', 'default': '🍽'
};
export const HEAT_CONFIG = {
  low: { label: 'Low', emoji: '🟢', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
  moderate: { label: 'Moderate', emoji: '🟡', color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
  high: { label: 'High', emoji: '🔴', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' }
};
