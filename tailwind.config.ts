import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        page: "#F8FAFC",
        sidebar: "#0F172A",
        card: "#FFFFFF",
        border: "#E2E8F0",
        primary: "#2563EB",
        success: "#10B981",
        warning: "#F59E0B",
        error: "#EF4444",
        text: {
          primary: "#0F172A",
          secondary: "#64748B",
          muted: "#94A3B8",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px 0 rgba(15, 23, 42, 0.06)",
      },
    },
  },
  plugins: [],
};
export default config;
