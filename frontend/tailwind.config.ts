import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#faf5ff",
          100: "#f3e8ff",
          200: "#e9d5ff",
          300: "#d8b4fe",
          400: "#c084fc",
          500: "#a855f7",
          600: "#9333ea",
          700: "#7c3aed",
          800: "#6d28d9",
          900: "#5b21b6",
          950: "#3b0764",
        },
        gold: {
          50:  "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
        },
        luxury: {
          bg:     "#faf8ff",
          soft:   "#f3f0ff",
          muted:  "#e9e3ff",
          dark:   "#1a0a2e",
          deeper: "#0d0715",
        },
      },
      fontFamily: {
        sans:    ["Plus Jakarta Sans", "Inter", "system-ui", "sans-serif"],
        poppins: ["Poppins", "sans-serif"],
        tamil:   ["Noto Sans Tamil", "sans-serif"],
        display: ["Playfair Display", "Georgia", "serif"],
      },
      backgroundImage: {
        "luxury-hero":    "linear-gradient(135deg, #1a0533 0%, #3b0764 40%, #5b21b6 75%, #4c1d95 100%)",
        "brand-gradient": "linear-gradient(135deg, #7c3aed, #9333ea)",
        "gold-gradient":  "linear-gradient(135deg, #f59e0b, #fbbf24, #d97706)",
      },
      animation: {
        "fade-in":    "fadeIn 0.5s ease-in-out",
        "slide-up":   "slideUp 0.4s ease-out",
        "bounce-slow":"bounce 2s infinite",
        shimmer:      "shimmer 2s infinite",
        "pulse-slow": "pulse 3s infinite",
        "float":      "float 4s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%":   { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)",    opacity: "1" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition:  "200% 0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%":      { transform: "translateY(-12px)" },
        },
      },
      boxShadow: {
        "brand-sm": "0 2px 12px rgba(124,58,237,0.18)",
        "brand-md": "0 8px 24px rgba(124,58,237,0.28)",
        "brand-lg": "0 16px 48px rgba(124,58,237,0.35)",
        "gold-md":  "0 8px 24px rgba(217,119,6,0.28)",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};

export default config;
