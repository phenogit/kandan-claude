import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Prediction Direction
        bull: "#DC2626", // red
        bear: "#059669", // green

        // Status
        pending: "#F59E0B",
        success: "#10B981",
        fail: "#EF4444",

        // UI
        primary: "#2563EB",
        background: "#FFFFFF",
        surface: "#F9FAFB",
        border: "#E5E7EB",
        "text-primary": "#111827",
        "text-secondary": "#6B7280",
      },
    },
  },
  plugins: [],
};
export default config;
