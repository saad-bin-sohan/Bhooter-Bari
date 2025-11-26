import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base: '#f4f5f7',
        accent: '#6c7ae0',
        soft: '#e3e6ed'
      },
      boxShadow: {
        neu: '9px 9px 18px #d2d5dd, -9px -9px 18px #ffffff',
        neuLg: '14px 14px 28px #d0d4dc, -14px -14px 28px #ffffff',
        neuInset: 'inset 8px 8px 16px #d2d5dd, inset -8px -8px 16px #ffffff',
        neuSm: '6px 6px 12px #d6d9e0, -6px -6px 12px #ffffff'
      },
      borderRadius: {
        xl: '22px'
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' }
        },
        pulseSoft: {
          '0%, 100%': { opacity: 0.4 },
          '50%': { opacity: 1 }
        }
      },
      animation: {
        float: 'float 5s ease-in-out infinite',
        pulseSoft: 'pulseSoft 1.5s ease-in-out infinite'
      }
    }
  },
  plugins: []
}

export default config
