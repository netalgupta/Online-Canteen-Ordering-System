import { format, formatDistanceToNow, parseISO } from 'date-fns';

export const formatTime = (date) => format(new Date(date), 'h:mm a');
export const formatDate = (date) => format(new Date(date), 'MMM d, yyyy');
export const formatDateTime = (date) => format(new Date(date), 'MMM d, h:mm a');
export const formatRelative = (date) => formatDistanceToNow(new Date(date), { addSuffix: true });

export const formatIST = (date) => {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata', hour: 'numeric', minute: '2-digit', hour12: true
  }).format(new Date(date));
};

export const formatDateIST = (date) => new Intl.DateTimeFormat('en-IN', {
  timeZone: 'Asia/Kolkata', month: 'short', day: 'numeric', year: 'numeric'
}).format(new Date(date));

export const getTimeSlotLabel = (start, end) => `${formatIST(start)} – ${formatIST(end)}`;
