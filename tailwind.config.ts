import type { Config } from "tailwindcss";

// Zedu Design System §11.2. Colours that change with the theme point at CSS variables in globals.css.
const config: Config = {
  darkMode: ["class", '[data-theme="dark"]'],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", "Geist", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "Geist Mono", "monospace"],
      },
      fontSize: {
        overline: ["11px", { lineHeight: "14px", letterSpacing: ".06em", fontWeight: "700" }],
        caption: ["12px", { lineHeight: "16px", fontWeight: "600" }],
        small: ["13px", { lineHeight: "18px" }],
        body: ["14px", { lineHeight: "20px" }],
        h3: ["17px", { lineHeight: "24px", letterSpacing: "-.01em", fontWeight: "700" }],
        h2: ["20px", { lineHeight: "28px", letterSpacing: "-.02em", fontWeight: "700" }],
        h1: ["28px", { lineHeight: "34px", letterSpacing: "-.03em", fontWeight: "800" }],
        "h1-sm": ["22px", { lineHeight: "28px", letterSpacing: "-.03em", fontWeight: "800" }],
        display: ["32px", { lineHeight: "36px", letterSpacing: "-.04em", fontWeight: "800" }],
        "display-sm": ["26px", { lineHeight: "30px", letterSpacing: "-.04em", fontWeight: "800" }],
      },
      colors: {
        bg: "var(--bg)",
        surface: { DEFAULT: "var(--surface)", sunken: "var(--surface-sunken)" },
        line: "var(--border)",
        ink: { DEFAULT: "var(--text)", muted: "var(--text-muted)" },
        brand: { DEFAULT: "var(--brand)", bright: "var(--brand-bright)", soft: "var(--brand-soft)" },
        accent: "var(--accent)",
        success: "rgb(var(--success-rgb) / <alpha-value>)",
        warning: "rgb(var(--warning-rgb) / <alpha-value>)",
        danger: "rgb(var(--danger-rgb) / <alpha-value>)",
        info: "rgb(var(--info-rgb) / <alpha-value>)",
        indigo: { 50: "#f4f3fb", 100: "#e6e0ff", 300: "#b9a8ff", 500: "#6d4dff", 700: "#3b1fa8", 900: "#24107a", 950: "#15123a" },
        coral: { 100: "#ffe9e2", 500: "#ff7a59" },
      },
      borderRadius: { sm: "6px", md: "10px", lg: "12px", xl: "18px" },
      boxShadow: {
        card: "var(--shadow-card)",
        raised: "var(--shadow-raised)",
        brand: "0 10px 24px -10px rgba(109,77,255,.8)",
        modal: "var(--shadow-modal)",
      },
      backgroundImage: {
        "gradient-brand": "linear-gradient(135deg,#6d4dff,#3b1fa8)",
        "gradient-hero": "linear-gradient(140deg,#24107a 0%,#4b2bd6 55%,#7c5cff 100%)",
        "gradient-progress": "linear-gradient(90deg,#6d4dff,#ff7a59)",
      },
      transitionTimingFunction: { out: "cubic-bezier(.2,.8,.2,1)" },
      transitionDuration: { fast: "150ms", base: "200ms", slow: "400ms", data: "1000ms" },
      keyframes: {
        wave: {
          "0%,100%": { transform: "rotate(0)" },
          "20%,60%": { transform: "rotate(16deg)" },
          "40%,80%": { transform: "rotate(-8deg)" },
        },
        shimmer: { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
      },
      animation: {
        wave: "wave 2s ease-in-out 1",
        shimmer: "shimmer 1.4s linear infinite",
      },
      maxWidth: { content: "1440px" },
    },
  },
  plugins: [],
};

export default config;
