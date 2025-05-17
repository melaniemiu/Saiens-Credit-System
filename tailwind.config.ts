import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

const config: Config = {
    darkMode: ["class"],
    content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
  	extend: {
  		fontFamily: {
  			'open-sans': ['var(--font-open-sans)', 'sans-serif'],
  			'sans': ['var(--font-open-sans)', 'sans-serif'],
  		},
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			},
  			// Updated Soft UI Colors - Professional palette
  			slate: {
  				50: "#f8fafc",
  				100: "#f1f5f9",
  				200: "#e2e8f0",
  				300: "#cbd5e1",
  				400: "#94a3b8",
  				500: "#64748b",
  				600: "#475569",
  				700: "#334155",
  				800: "#1e293b",
  				900: "#0f172a",
  			},
  			gray: {
  				50: "#f9fafb",
  				100: "#f3f4f6",
  				200: "#e5e7eb",
  				300: "#d1d5db",
  				400: "#9ca3af",
  				500: "#6b7280",
  				600: "#4b5563",
  				700: "#374151",
  				800: "#1f2937",
  				900: "#111827",
  			},
  			// Professional blue for primary actions
  			blue: {
  				50: "#f0f9ff",
  				100: "#e0f2fe",
  				200: "#bfdbfe",
  				300: "#93c5fd",
  				400: "#60a5fa",
  				500: "#3b82f6",
  				600: "#2563eb",
  				700: "#1d4ed8",
  				800: "#1e40af",
  				900: "#1e3a8a",
  			},
  			// Muted green for success states
  			green: {
  				50: "#f0fdf4",
  				100: "#dcfce7",
  				200: "#bbf7d0",
  				300: "#86efac",
  				400: "#4ade80",
  				500: "#22c55e",
  				600: "#16a34a",
  				700: "#15803d",
  				800: "#166534",
  				900: "#14532d",
  			},
  			// Professional indigo
  			indigo: {
  				50: "#eef2ff",
  				100: "#e0e7ff",
  				200: "#c7d2fe",
  				300: "#a5b4fc",
  				400: "#818cf8",
  				500: "#6366f1",
  				600: "#4f46e5",
  				700: "#4338ca",
  				800: "#3730a3",
  				900: "#312e81",
  			},
  		},
  		fontSize: {
  			'size-xs': '0.75rem',
  			'size-sm': '0.875rem',
  			'size-base': '1rem',
  			'size-lg': '1.125rem',
  			'size-xl': '1.25rem',
  			'size-2xl': '1.5rem',
  			'size-3xl': '1.875rem',
  			'size-4xl': '2.25rem',
  			'size-5xl': '3rem',
  			'size-6xl': '4rem',
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)',
  			'2xl': '1rem',
  		},
  		spacing: {
  			'0.75': '0.1875rem',
  			'1.2': '0.3rem',
  			'2.7': '0.675rem',
  			'4.5': '1.125rem',
  			'5.5': '1.375rem',
  			'6.5': '1.625rem',
  			'7.5': '1.875rem',
  			'8.5': '2.125rem',
  			'9.5': '2.375rem',
  			'19.5': '4.875rem',
  			'30': '7.5rem',
  			'62.5': '15.625rem',
  		},
  		boxShadow: {
  			'soft-xl': '0 10px 40px -10px rgba(0,0,0,.15)',
  			'soft-2xl': '0 20px 27px 0 rgba(0, 0, 0, 0.05)',
  		},
  		backgroundImage: {
  			// More subtle, professional gradients
  			'gradient-primary': 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
  			'gradient-secondary': 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
  			'gradient-success': 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
  			'gradient-info': 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
  			'gradient-warning': 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
  			'gradient-danger': 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
  			'gradient-dark': 'linear-gradient(135deg, #374151 0%, #1f2937 100%)',
  			'gradient-muted': 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
  			// Subtle overlay gradients
  			'gradient-horizontal-dark': 'linear-gradient(90deg, transparent, rgba(0, 0, 0, 0.1), transparent)',
  			'gradient-vertical-light': 'linear-gradient(180deg, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0))',
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		},
  		transitionProperty: {
  			'nav-brand': 'margin, width',
  		},
  		transitionDuration: {
  			'nav-brand': '200ms',
  		},
  		zIndex: {
  			'990': '990',
  		},
  	}
  },
  plugins: [
  	require("tailwindcss-animate"),
  	plugin(function ({ addUtilities, addComponents, theme }) {
  		addUtilities({
  			'.bg-gradient-horizontal-dark': {
  				backgroundImage: 'linear-gradient(90deg, transparent, rgba(0, 0, 0, 0.4), transparent)',
  			},
  			'.ease-nav-brand': {
  				transitionTimingFunction: 'ease',
  			},
  			'.ease-soft': {
  				transitionTimingFunction: 'cubic-bezier(0.2, 0.82, 0.165, 1)',
  			},
  			'.duration-600': {
  				transitionDuration: '600ms',
  			},
  			'.shadow-soft-xl': {
  				boxShadow: '0 10px 40px -10px rgba(0,0,0,.15)',
  			},
  			'.shadow-soft-2xl': {
  				boxShadow: '0 20px 27px 0 rgba(0, 0, 0, 0.05)',
  			},
  			'.font-weight-bolder': {
  				fontWeight: '700',
  			},
  			'.gradient-text': {
  				background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  				'-webkit-background-clip': 'text',
  				'-webkit-text-fill-color': 'transparent',
  			},
  		});
  		addComponents({
  			'.soft-card': {
  				position: 'relative',
  				display: 'flex',
  				flexDirection: 'column',
  				minWidth: '0',
  				wordWrap: 'break-word',
  				backgroundColor: '#fff',
  				backgroundClip: 'border-box',
  				borderRadius: '1rem',
  				boxShadow: '0 10px 40px -10px rgba(0,0,0,.15)',
  			},
  		});
  	}),
  ],
};
export default config;