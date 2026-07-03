/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "var(--background)",
        foreground: "var(--foreground)",
        civic: {
          blue: {
            DEFAULT: "var(--civic-blue)",
            dark: "var(--civic-blue-dark)",
            light: "var(--civic-blue-light)",
          }
        },
        severity: {
          critical: "var(--severity-critical)",
          high: "var(--severity-high)",
          medium: "var(--severity-medium)",
          low: "var(--severity-low)",
          info: "var(--severity-info)",
        },
        ai: {
          purple: {
            DEFAULT: "var(--ai-purple)",
            light: "var(--ai-purple-light)",
          },
          teal: "var(--ai-teal)",
        },
        community: {
          green: "var(--community-green)",
        },
        primary: {
          DEFAULT: "var(--civic-blue)",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "var(--gray-700)",
          foreground: "var(--gray-50)",
        },
        muted: {
          DEFAULT: "var(--gray-200)",
          foreground: "var(--gray-500)",
        },
        card: {
          DEFAULT: "#ffffff",
          foreground: "var(--gray-900)",
        }
      },
      fontFamily: {
        sans: ["var(--font-primary)", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
      },
      animation: {
        "agent-pulse": "agent-pulse 2s infinite ease-in-out",
        "card-slide-up": "card-slide-up 0.4s ease-out",
      },
      keyframes: {
        "agent-pulse": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        "card-slide-up": {
          "0%": { transform: "translateY(16px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        }
      }
    },
  },
  plugins: [],
}
