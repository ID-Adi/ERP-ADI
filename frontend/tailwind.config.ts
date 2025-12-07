import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Claude.ai inspired warm palette
        primary: {
          50: '#FEF7F4',
          100: '#FDEDE6',
          200: '#FBDACC',
          300: '#F7BFA8',
          400: '#F19A75',
          500: '#D97757',  // Main terracotta
          600: '#C4623F',
          700: '#A34E32',
          800: '#7F3E28',
          900: '#5C2E1E',
        },
        // Warm background colors
        surface: {
          50: '#FEFDFB',
          100: '#FAF9F6',
          200: '#F5F3EE',
          300: '#E8E4DF',
          400: '#D4CFC8',
        },
        // Warm gray for text
        warmgray: {
          50: '#FAFAF9',
          100: '#F5F5F4',
          200: '#E7E5E4',
          300: '#D6D3D1',
          400: '#A8A29E',
          500: '#78716C',
          600: '#57534E',
          700: '#44403C',
          800: '#292524',
          900: '#1C1917',
        },
        success: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
        },
        warning: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
        },
        danger: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C1C',
        },
      },
      boxShadow: {
        'soft': '0 2px 8px -2px rgba(0, 0, 0, 0.05), 0 4px 16px -4px rgba(0, 0, 0, 0.05)',
        'soft-lg': '0 4px 12px -4px rgba(0, 0, 0, 0.08), 0 8px 24px -8px rgba(0, 0, 0, 0.06)',
      },
    },
  },
  plugins: [],
};
export default config;
