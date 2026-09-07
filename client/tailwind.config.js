/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    'bg-gray-100', 'text-gray-700', 'bg-blue-100', 'text-blue-700',
    'bg-indigo-100', 'text-indigo-700', 'bg-amber-100', 'text-amber-700',
    'bg-green-100', 'text-green-700', 'text-gray-500', 'bg-red-100', 'text-red-700',
    'bg-orange-100', 'text-orange-700', 'border-b-red-500', 'bg-red-50',
    'border-b-blue-500', 'bg-blue-50', 'border-b-amber-500', 'bg-amber-50',
    'border-b-green-500', 'bg-green-50', 'border-green-200', 'border-yellow-200', 'border-red-200',
    'border-r-2', 'border-primary', 'bg-sidebar-hover', 'text-white'
  ],
  theme: {
    extend: {
      colors: {
        sidebar: { DEFAULT: '#1E2433', hover: '#2d3748', active: '#374151' },
        topbar: '#C41230',
        content: '#F0F2F5',
        btnDark: '#3d4451',
        primary: {
          50:'#FEF2F4',
          100:'#FDDDE1',
          200:'#FAB8C0',
          300:'#F78595',
          400:'#F35270',
          500:'#C41230',
          600:'#A00F28',
          700:'#7B0D1A',
          800:'#580910',
          900:'#350508',
          DEFAULT: '#C41230'
        },
        canteen: {
          bg: '#F9FAFB',
          card: '#FFFFFF',
          border: '#E5E7EB',
          textPrimary: '#111827',
          textSecondary: '#6B7280',
        }
      }
    },
  },
  plugins: [],
}
