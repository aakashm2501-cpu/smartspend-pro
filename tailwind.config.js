/** @type {import("tailwindcss").Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: "#0A192F",
          orange: "#FF6B35",
          light: "#F8F9FA",
          dark: "#112240",
          accent: "#2A4B7C"
        }
      },
      fontFamily: {
        sans: ["Space Grotesk", "sans-serif"],
      }
    },
  },
  plugins: [],
}
