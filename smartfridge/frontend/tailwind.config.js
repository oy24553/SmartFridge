/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      keyframes: {
        'gradient-x': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'gradient-xy': {
          '0%, 100%': { backgroundPosition: '0% 0%' },
          '50%': { backgroundPosition: '100% 100%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        blob: {
          '0%': { transform: 'translate(0,0) scale(1)' },
          '33%': { transform: 'translate(10px,-10px) scale(1.05)' },
          '66%': { transform: 'translate(-10px,10px) scale(0.95)' },
          '100%': { transform: 'translate(0,0) scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        typing: {
          '0%': { width: '0ch' },
          '100%': { width: 'var(--n,24ch)' },
        },
        blink: { '50%': { borderColor: 'transparent' } },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'gradient-x': 'gradient-x 8s ease infinite',
        'gradient-xy': 'gradient-xy 12s ease infinite',
        float: 'float 6s ease-in-out infinite',
        blob: 'blob 12s ease-in-out infinite',
        shimmer: 'shimmer 1.8s linear infinite',
        typing: 'typing 3s steps(24,end) 1 both, blink .8s step-end infinite',
        'fade-in-up': 'fade-in-up .6s ease both',
      },
    },
  },
  plugins: [],
}
