import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        playfair: ["Playfair Display", "serif"],
        inter: ["Inter", "sans-serif"],
        script: ["Dancing Script", "cursive"],
        elegant: ["Great Vibes", "cursive"],
        cormorant: ["Cormorant Garamond", "serif"],
        baskerville: ["Libre Baskerville", "serif"],
      },
      colors: {
        wine: {
          DEFAULT: "#722F37",
          50: "#FDF2F3",
          100: "#FCE7E8",
          200: "#F9D1D3",
          300: "#F4A8AD",
          400: "#EC757C",
          500: "#DF4A52",
          600: "#C8333C",
          700: "#A82730",
          800: "#8D242D",
          900: "#722F37",
        },
        rosé: {
          light: "#f8d7da",
          DEFAULT: "#e8b4b8",
          medium: "#d4919a",
          dark: "#b85d6b",
        },
        cabernet: {
          DEFAULT: "#5c1a1b",
          dark: "#4a1516",
        },
        cork: {
          light: "#faf9f7",
          DEFAULT: "#f4f1eb",
          brown: "#8b4513",
        },
        gold: {
          muted: "#d4af37",
          DEFAULT: "#c9a426",
          dark: "#b8941f",
        },
        eggplant: {
          DEFAULT: "#573446",
          50: "#FAF8F9",
          100: "#F4EEF1",
          200: "#E6D5DD",
          300: "#D1B5C1",
          400: "#B88DA1",
          500: "#9E6A80",
          600: "#855368",
          700: "#6D4453",
          800: "#573446",
          900: "#462A38",
        },
        federal: {
          DEFAULT: "#16166B",
          50: "#F0F0FE",
          100: "#E4E4FD",
          200: "#CDCDFA",
          300: "#A5A5F6",
          400: "#7575F0",
          500: "#4D4DE8",
          600: "#2F2FDC",
          700: "#2525C8",
          800: "#2121A3",
          900: "#16166B",
        },
        smoke: {
          DEFAULT: "#F5F5F5",
          50: "#FFFFFF",
          100: "#FAFAFA",
          200: "#F5F5F5",
          300: "#EFEFEF",
          400: "#E5E5E5",
          500: "#D4D4D4",
          600: "#A3A3A3",
          700: "#737373",
          800: "#525252",
          900: "#404040",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
