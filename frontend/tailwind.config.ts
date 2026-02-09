import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dark base colors
        bg: {
          primary: "#0f0f0f",
          secondary: "#1a1a1a",
          tertiary: "#242424",
          elevated: "#1e1e1e",
        },
        // Text colors
        text: {
          primary: "#fafafa",
          secondary: "#a3a3a3",
          tertiary: "#737373",
        },
        // Luxury gold accent
        gold: {
          DEFAULT: "#fbbf24", // amber-400
          dark: "#d97706", // amber-600
          light: "#fcd34d", // amber-300
          glow: "rgba(251, 191, 36, 0.2)",
        },
        // Semantic colors
        success: {
          DEFAULT: "#34d399", // emerald-400
          dark: "#059669", // emerald-600
        },
        warning: {
          DEFAULT: "#fbbf24", // amber-400
          dark: "#d97706",
        },
        error: {
          DEFAULT: "#f87171", // red-400
          dark: "#dc2626", // red-600
        },
        info: {
          DEFAULT: "#60a5fa", // blue-400
          dark: "#2563eb", // blue-600
        },
        // Borders
        border: {
          subtle: "rgba(255, 255, 255, 0.08)",
          medium: "rgba(255, 255, 255, 0.12)",
          strong: "rgba(255, 255, 255, 0.18)",
        },
      },
      boxShadow: {
        sm: "0 2px 8px rgba(0, 0, 0, 0.3)",
        DEFAULT: "0 4px 16px rgba(0, 0, 0, 0.4)",
        md: "0 4px 16px rgba(0, 0, 0, 0.4)",
        lg: "0 12px 32px rgba(0, 0, 0, 0.5)",
        xl: "0 20px 48px rgba(0, 0, 0, 0.6)",
        glow: "0 0 24px rgba(251, 191, 36, 0.2)",
        "glow-lg": "0 0 32px rgba(251, 191, 36, 0.3)",
      },
      backdropBlur: {
        glass: "12px",
      },
      borderRadius: {
        sm: "8px",
        DEFAULT: "12px",
        md: "12px",
        lg: "16px",
        xl: "20px",
        "2xl": "24px",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      fontSize: {
        xs: ["0.75rem", { lineHeight: "1rem" }],
        sm: ["0.875rem", { lineHeight: "1.25rem" }],
        base: ["1rem", { lineHeight: "1.5rem" }],
        lg: ["1.125rem", { lineHeight: "1.75rem" }],
        xl: ["1.25rem", { lineHeight: "1.75rem" }],
        "2xl": ["1.5rem", { lineHeight: "2rem" }],
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
        "4xl": ["2.25rem", { lineHeight: "2.5rem" }],
        "5xl": ["3rem", { lineHeight: "1" }],
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "fade-out": "fadeOut 0.3s ease-in",
        "slide-in": "slideIn 0.3s ease-out",
        "slide-out": "slideOut 0.3s ease-in",
        "scale-in": "scaleIn 0.2s ease-out",
        "scale-out": "scaleOut 0.2s ease-in",
        shimmer: "shimmer 2s linear infinite",
        glow: "glow 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        fadeOut: {
          from: { opacity: "1" },
          to: { opacity: "0" },
        },
        slideIn: {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        slideOut: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(100%)" },
        },
        scaleIn: {
          from: { transform: "scale(0.95)", opacity: "0" },
          to: { transform: "scale(1)", opacity: "1" },
        },
        scaleOut: {
          from: { transform: "scale(1)", opacity: "1" },
          to: { transform: "scale(0.95)", opacity: "0" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
        glow: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/forms"), require("@tailwindcss/typography")],
};

export default config;
