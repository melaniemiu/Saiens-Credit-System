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
  			// Soft UI Colors
  			slate: {
  				50: "#f8fafc",
  				100: "#dee2e6",
  				200: "#cbd3da",
  				300: "#a8b8d8",
  				400: "#8392ab",
  				500: "#67748e",
  				600: "#627594",
  				700: "#344767",
  				800: "#3a416f",
  				900: "#0f172a",
  			},
  			gray: {
  				50: "#f8f9fa",
  				100: "#ebeff4",
  				200: "#e9ecef",
  				300: "#d2d6da",
  				400: "#ced4da",
  				500: "#adb5bd",
  				600: "#6c757d",
  				700: "#495057",
  				800: "#343a40",
  				900: "#212529",
  			},
  			lime: {
  				50: "#f7fee7",
  				100: "#ecfccb",
  				200: "#d9f99d",
  				300: "#bef264",
  				400: "#a3e635",
  				500: "#82d616",
  				600: "#65a30d",
  				700: "#4d7c0f",
  				800: "#3f6212",
  				900: "#365314",
  			},
  			cyan: {
  				50: "#ecfeff",
  				100: "#cffafe",
  				200: "#a5f3fc",
  				300: "#67e8f9",
  				400: "#21d4fd",
  				500: "#17c1e8",
  				600: "#0891b2",
  				700: "#0e7490",
  				800: "#155e75",
  				900: "#164e63",
  			},
  			fuchsia: {
  				50: "#fdf4ff",
  				100: "#fae8ff",
  				200: "#f5d0fe",
  				300: "#e293d3",
  				400: "#e879f9",
  				500: "#cb0c9f",
  				600: "#c026d3",
  				700: "#a21caf",
  				800: "#830866",
  				900: "#701a75",
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
  			'gradient-fuchsia': 'linear-gradient(310deg, #cb0c9f, #7928ca)',
  			'gradient-cyan': 'linear-gradient(310deg, #627594, #17c1e8)',
  			'gradient-lime': 'linear-gradient(310deg, #82d616, #a3e635)',
  			'gradient-orange': 'linear-gradient(310deg, #fb6340, #f56036)',
  			'gradient-pink': 'linear-gradient(310deg, #ff0080, #d6336c)',
  			'gradient-red': 'linear-gradient(310deg, #ea0606, #ff667c)',
  			'gradient-slate': 'linear-gradient(310deg, #627594, #a8b8d8)',
  			'gradient-dark-gray': 'linear-gradient(310deg, #141727, #3a416f)',
  			'gradient-horizontal-dark': 'linear-gradient(90deg, transparent, rgba(0, 0, 0, 0.4), transparent)',
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