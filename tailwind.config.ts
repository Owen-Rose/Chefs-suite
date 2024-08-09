import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      colors: {
        primary: "#1E3A8A", // Dark Blue
        secondary: "#10B981", // Green
        accent: "#F59E0B", // Orange
      },
      fontFamily: {
        sans: ["Roboto", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
