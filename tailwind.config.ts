import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        slatebg: {
          DEFAULT: "#0b1220",
          light: "#111a2e"
        }
      }
    },
  },
  plugins: [],
} satisfies Config;
