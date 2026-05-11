/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // DocuMind brand palette
        brand: {
          50:  '#f0f0ff',
          100: '#e4e4ff',
          200: '#ceceff',
          300: '#adadff',
          400: '#8b82ff',
          500: '#7c6bfa',  // primary
          600: '#6b52f0',
          700: '#5a3ddb',
          800: '#4a33b5',
          900: '#3d2e8f',
          950: '#241b56',
        },
        // Accent: electric violet
        violet: {
          glow: '#8b5cf6',
        },
        // Dark surfaces
        dark: {
          950: '#080812',
          900: '#0d0d1a',
          800: '#12121f',
          700: '#1a1a2e',
          600: '#1e1e35',
          500: '#252540',
          400: '#2e2e50',
          300: '#3d3d65',
        },
        // Neutral warm
        slate: {
          950: '#0a0a14',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Cal Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      backgroundImage: {
        'brand-gradient':    'linear-gradient(135deg, #7c6bfa 0%, #a855f7 50%, #ec4899 100%)',
        'dark-gradient':     'linear-gradient(135deg, #080812 0%, #0d0d1a 50%, #12121f 100%)',
        'glass-gradient':    'linear-gradient(135deg, rgba(124,107,250,0.1) 0%, rgba(168,85,247,0.05) 100%)',
        'card-gradient':     'linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
        'hero-gradient':     'radial-gradient(ellipse at 50% 0%, rgba(124,107,250,0.3) 0%, transparent 70%)',
        'glow-gradient':     'radial-gradient(circle at center, rgba(124,107,250,0.4) 0%, transparent 60%)',
      },
      boxShadow: {
        'brand':      '0 0 0 1px rgba(124,107,250,0.3), 0 4px 24px rgba(124,107,250,0.2)',
        'brand-lg':   '0 0 0 1px rgba(124,107,250,0.4), 0 8px 48px rgba(124,107,250,0.3)',
        'card':       '0 1px 3px rgba(0,0,0,0.4), 0 4px 20px rgba(0,0,0,0.3)',
        'card-hover': '0 4px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(124,107,250,0.2)',
        'glow':       '0 0 40px rgba(124,107,250,0.3)',
        'glow-sm':    '0 0 20px rgba(124,107,250,0.2)',
        'inner-glow': 'inset 0 1px 0 rgba(255,255,255,0.05)',
      },
      animation: {
        'gradient-x':  'gradient-x 8s ease infinite',
        'float':       'float 6s ease-in-out infinite',
        'pulse-slow':  'pulse 3s ease-in-out infinite',
        'shimmer':     'shimmer 2s linear infinite',
        'fade-in':     'fadeIn 0.5s ease-out',
        'slide-up':    'slideUp 0.4s ease-out',
        'glow-pulse':  'glowPulse 2s ease-in-out infinite',
      },
      keyframes: {
        'gradient-x': {
          '0%,100%': { 'background-position': '0% 50%' },
          '50%':     { 'background-position': '100% 50%' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0px)' },
          '50%':     { transform: 'translateY(-16px)' },
        },
        shimmer: {
          '0%':   { 'background-position': '-200% 0' },
          '100%': { 'background-position': '200% 0' },
        },
        fadeIn: {
          '0%':   { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glowPulse: {
          '0%,100%': { 'box-shadow': '0 0 20px rgba(124,107,250,0.2)' },
          '50%':     { 'box-shadow': '0 0 40px rgba(124,107,250,0.5)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
    },
  },
  plugins: [],
}
