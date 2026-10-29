import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/app/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "hsl(var(--canvas))",
        surface: "hsl(var(--surface))",
        ink: {
          DEFAULT: "hsl(var(--ink))",
          soft: "hsl(var(--ink-soft))",
          quiet: "hsl(var(--ink-quiet))",
        },
        line: "hsl(var(--line))",
        accent: {
          DEFAULT: "hsl(var(--accent))",
          soft: "hsl(var(--accent-soft))",
        },
        cream: "hsl(var(--cream))",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      boxShadow: {
        paper:
          "0 1px 2px rgba(21, 21, 19, 0.04), 0 18px 45px -18px rgba(21, 21, 19, 0.22)",
        lift: "0 2px 8px rgba(21, 21, 19, 0.06), 0 12px 32px -16px rgba(21, 21, 19, 0.18)",
        float:
          "0 1px 1px rgba(21, 21, 19, 0.03), 0 24px 60px -20px rgba(21, 21, 19, 0.28)",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.97)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "dialog-in": {
          from: {
            opacity: "0",
            transform: "translate(-50%, -50%) scale(0.97)",
          },
          to: { opacity: "1", transform: "translate(-50%, -50%) scale(1)" },
        },
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-up": "fade-up 500ms cubic-bezier(0.22, 1, 0.36, 1) both",
        "fade-in": "fade-in 300ms ease-out both",
        "scale-in": "scale-in 200ms cubic-bezier(0.22, 1, 0.36, 1) both",
        "dialog-in": "dialog-in 200ms cubic-bezier(0.22, 1, 0.36, 1) both",
        "accordion-down": "accordion-down 220ms cubic-bezier(0.22, 1, 0.36, 1)",
        "accordion-up": "accordion-up 180ms cubic-bezier(0.22, 1, 0.36, 1)",
      },
      transitionTimingFunction: {
        "out-expo": "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
