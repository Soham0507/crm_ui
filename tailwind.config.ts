import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      // Layered "3D depth" look shared by the landing page and the app.
      boxShadow: {
        "depth-sm": "0 4px 0 #DCE3EA, 0 16px 28px -18px rgba(15,23,42,0.28)",
        depth: "inset 0 2px 0 #FFFFFF, 0 8px 0 #DCE3EA, 0 30px 50px -24px rgba(15,23,42,0.30)",
        "depth-lg": "0 12px 0 #DCE3EA, 0 50px 80px -30px rgba(15,23,42,0.45)",
        press: "0 3px 0 #D5DCE4",
        "press-down": "0 1px 0 #D5DCE4",
        "press-brand": "0 4px 0 #004941, 0 10px 18px -10px rgba(15,118,110,0.6)",
        "press-brand-down": "0 1px 0 #004941",
        "press-danger": "0 4px 0 #991B1B",
      },
      colors: {
        brand: { DEFAULT: "#0F766E", deep: "#004941", soft: "#E6F4F1", bright: "#2DD4BF" },
        ink: { DEFAULT: "#0F172A", body: "#475467", muted: "#5B6474" },
        line: { DEFAULT: "#E4E9EF", strong: "#DCE3EA" },
        subtle: "#F2F5F9",
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        chart: {
          "1": "var(--chart-1)",
          "2": "var(--chart-2)",
          "3": "var(--chart-3)",
          "4": "var(--chart-4)",
          "5": "var(--chart-5)",
        },
        sidebar: {
          DEFAULT: "var(--sidebar-background)",
          foreground: "var(--sidebar-foreground)",
          primary: "var(--sidebar-primary)",
          "primary-foreground": "var(--sidebar-primary-foreground)",
          accent: "var(--sidebar-accent)",
          "accent-foreground": "var(--sidebar-accent-foreground)",
          border: "var(--sidebar-border)",
          ring: "var(--sidebar-ring)",
        },
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
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
