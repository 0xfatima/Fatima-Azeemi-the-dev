/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: "#121212",
          surface: "#18181b",
          card: "#202024",
          border: "#2e2e33",
          text: "#f3f4f6",
          muted: "#a1a1aa",
        },
        cream: {
          bg: "#fbf9f5",
          surface: "#f3efe6",
          card: "#e8e3d8",
          border: "#d9d2c5",
          text: "#27272a",
          muted: "#71717a",
        },
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "sans-serif"],
        heading: ["Space Grotesk", "sans-serif"],
      },
    },
  },
  plugins: [],
};
