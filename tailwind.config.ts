import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Outfit'", "sans-serif"],
        body: ["'DM Sans'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      colors: {
        primary: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
        },
        ink: {
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
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
        "card-hover": "0 4px 12px rgba(0,0,0,0.08), 0 12px 32px rgba(0,0,0,0.06)",
        glow: "0 0 24px rgba(59,130,246,0.25)",
        "glow-green": "0 0 24px rgba(16,185,129,0.25)",
        "glow-red": "0 0 24px rgba(239,68,68,0.2)",
      },
      animation: {
        "fade-up": "fadeUp 0.4s ease-out both",
        "fade-in": "fadeIn 0.3s ease-out both",
        "scale-in": "scaleIn 0.3s cubic-bezier(0.34,1.56,0.64,1) both",
        "slide-right": "slideRight 0.3s ease-out both",
        "bounce-in": "bounceIn 0.5s cubic-bezier(0.34,1.56,0.64,1) both",
        shimmer: "shimmer 1.6s ease-in-out infinite",
        float: "float 3s ease-in-out infinite",
        "spin-slow": "spin 4s linear infinite",
        wiggle: "wiggle 0.5s ease-in-out",
        "pulse-ring": "pulseRing 1.5s ease-out infinite",
      },
      keyframes: {
        fadeUp: { from: { opacity: "0", transform: "translateY(16px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        fadeIn: { from: { opacity: "0" }, to: { opacity: "1" } },
        scaleIn: { from: { opacity: "0", transform: "scale(0.88)" }, to: { opacity: "1", transform: "scale(1)" } },
        slideRight: { from: { opacity: "0", transform: "translateX(-12px)" }, to: { opacity: "1", transform: "translateX(0)" } },
        bounceIn: { from: { opacity: "0", transform: "scale(0.7)" }, to: { opacity: "1", transform: "scale(1)" } },
        shimmer: { "0%": { backgroundPosition: "-400px 0" }, "100%": { backgroundPosition: "400px 0" } },
        float: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-8px)" } },
        wiggle: { "0%,100%": { transform: "rotate(0deg)" }, "25%": { transform: "rotate(-5deg)" }, "75%": { transform: "rotate(5deg)" } },
        pulseRing: { "0%": { transform: "scale(1)", opacity: "0.8" }, "100%": { transform: "scale(1.6)", opacity: "0" } },
      },
    },
  },
  plugins: [],
};

export default config;
