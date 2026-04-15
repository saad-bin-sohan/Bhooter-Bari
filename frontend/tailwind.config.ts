import type { Config } from 'tailwindcss'
import forms from '@tailwindcss/forms'
import typography from '@tailwindcss/typography'

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--bg) / <alpha-value>)',
        surface: {
          DEFAULT: 'hsl(var(--surface) / <alpha-value>)',
          2: 'hsl(var(--surface-2) / <alpha-value>)',
          3: 'hsl(var(--surface-3) / <alpha-value>)'
        },
        foreground: 'hsl(var(--text) / <alpha-value>)',
        muted: 'hsl(var(--text-muted) / <alpha-value>)',
        border: 'hsl(var(--border) / <alpha-value>)',
        primary: {
          DEFAULT: 'hsl(var(--primary) / <alpha-value>)',
          2: 'hsl(var(--primary-2) / <alpha-value>)',
          foreground: 'hsl(var(--primary-foreground) / <alpha-value>)'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent) / <alpha-value>)',
          foreground: 'hsl(var(--accent-foreground) / <alpha-value>)'
        },
        success: {
          DEFAULT: 'hsl(var(--success) / <alpha-value>)',
          foreground: 'hsl(var(--success-foreground) / <alpha-value>)'
        },
        warning: {
          DEFAULT: 'hsl(var(--warning) / <alpha-value>)',
          foreground: 'hsl(var(--warning-foreground) / <alpha-value>)'
        },
        danger: {
          DEFAULT: 'hsl(var(--danger) / <alpha-value>)',
          foreground: 'hsl(var(--danger-foreground) / <alpha-value>)'
        }
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'Courier New', 'monospace']
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.4rem' }],
        base: ['1rem', { lineHeight: '1.65rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.25rem', { lineHeight: '1.8rem' }],
        '2xl': ['1.5rem', { lineHeight: '1.9rem' }],
        '3xl': ['1.875rem', { lineHeight: '1.15' }],
        '4xl': ['2.25rem', { lineHeight: '1.1' }],
        '5xl': ['3rem', { lineHeight: '1.05' }],
        '6xl': ['3.75rem', { lineHeight: '1.02' }],
        '7xl': ['4.5rem', { lineHeight: '1.0' }],
        '8xl': ['6rem', { lineHeight: '1.0' }]
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '14px',
        xl: '16px',
        '2xl': '20px',
        '3xl': '28px'
      },
      boxShadow: {
        xs: '0 1px 2px hsl(var(--shadow) / 0.08)',
        sm: '0 1px 3px hsl(var(--shadow) / 0.1), 0 4px 8px -4px hsl(var(--shadow) / 0.08)',
        md: '0 4px 16px -4px hsl(var(--shadow) / 0.15), 0 1px 3px hsl(var(--shadow) / 0.08)',
        lg: '0 8px 32px -8px hsl(var(--shadow) / 0.2), 0 2px 8px -2px hsl(var(--shadow) / 0.1)',
        xl: '0 16px 48px -12px hsl(var(--shadow) / 0.25)',
        teal: '0 0 0 1px hsl(var(--primary) / 0.3), 0 4px 20px -4px hsl(var(--primary) / 0.25)',
        'inset-border': 'inset 0 0 0 1px hsl(var(--border) / 0.8)'
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' }
        },
        pulseDot: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' }
        }
      },
      animation: {
        'fade-up': 'fadeUp 0.45s ease-out both',
        'fade-in': 'fadeIn 0.35s ease-out both',
        'slide-in-right': 'slideInRight 0.4s ease-out both',
        'pulse-dot': 'pulseDot 1.4s ease-in-out infinite'
      }
    }
  },
  plugins: [forms, typography]
}

export default config
