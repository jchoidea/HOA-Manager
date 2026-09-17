import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#FAFAF7",
        ink: "#1C2321",
        evergreen: {
          DEFAULT: "#2F4A3E",
          light: "#3D5A4C",
          dark: "#20342B",
        },
        sound: {
          DEFAULT: "#7A8B99",
          light: "#B7C2CA",
        },
        rust: "#B5562B",
        hairline: "#DEDAD0",
        stone: "#F0EEE7",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        body: ["var(--font-plex)", "sans-serif"],
      },
      maxWidth: {
        prose: "68ch",
      },
    },
  },
  plugins: [],
};

export default config;
