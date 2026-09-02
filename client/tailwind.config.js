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
    'border-b-green-500', 'bg-green-50', 'border-green-200', 'border-yellow-200', 'border-red-200'
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#FEF2F2',
          100: '#FDECEA',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#E53030',
          600: '#C41230',  // Main Somaiya crimson
          700: '#9B1020',
          800: '#7B0D1A',
          900: '#5C0A14',
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
