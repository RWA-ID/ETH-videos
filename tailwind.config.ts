import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./{app,pages,components,hooks,lib}/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        // Brand neon palette
        neon: {
          cyan: "#00f5ff",
          purple: "#bf5af2",
          green: "#30d158",
          pink: "#ff375f",
          orange: "#ff9f0a",
        },
        eth: {
          dark: "#0a0a0f",
          card: "#111118",
          border: "#1e1e2e",
          surface: "#16161f",
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "neon-gradient":
          "linear-gradient(135deg, #00f5ff 0%, #bf5af2 50%, #ff375f 100%)",
        "card-gradient":
          "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.8) 100%)",
      },
      fontFamily: {
        sans: ["Satoshi", "Inter", "var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.4s ease-out",
        "slide-down": "slideDown 0.4s ease-out",
        "pulse-neon": "pulseNeon 2s ease-in-out infinite",
        "spin-slow": "spin 3s linear infinite",
        float: "float 6s ease-in-out infinite",
        shimmer: "shimmer 2s infinite",
        "flip-word": "flipWord 0.5s ease-in-out",
        typewriter: "typewriter 0.05s step-end",
        "bounce-in": "bounceIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
        "glow-pulse": "glowPulse 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideDown: {
          "0%": { transform: "translateY(-20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        pulseNeon: {
          "0%, 100%": {
            boxShadow: "0 0 5px #00f5ff, 0 0 20px #00f5ff44",
          },
          "50%": {
            boxShadow: "0 0 20px #00f5ff, 0 0 60px #00f5ff66",
          },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        flipWord: {
          "0%": { transform: "rotateX(90deg)", opacity: "0" },
          "100%": { transform: "rotateX(0deg)", opacity: "1" },
        },
        bounceIn: {
          "0%": { transform: "scale(0.3)", opacity: "0" },
          "50%": { transform: "scale(1.05)" },
          "70%": { transform: "scale(0.9)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        glowPulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        neon: "0 0 20px rgba(0, 245, 255, 0.3), 0 0 60px rgba(0, 245, 255, 0.1)",
        "neon-purple":
          "0 0 20px rgba(191, 90, 242, 0.3), 0 0 60px rgba(191, 90, 242, 0.1)",
        "neon-pink":
          "0 0 20px rgba(255, 55, 95, 0.3), 0 0 60px rgba(255, 55, 95, 0.1)",
        "card-glow": "0 8px 32px rgba(0, 0, 0, 0.8)",
      },
    },
  },
  plugins: [],
};

export default config;
