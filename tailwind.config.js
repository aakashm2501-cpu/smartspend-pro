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
          navy: "#09090B",     /* App Background - Deep Dark Zinc */
          orange: "#FF5A36",   /* Primary Action - Vibrant Coral */
          light: "#FAFAFA",    /* Text Primary */
          dark: "#18181B",     /* Card Surface */
          accent: "#27272A"    /* Card Border / Secondary Surface */
        }
      },
      fontFamily: {
        sans: ["Space Grotesk", "sans-serif"],
      }
    },
  },
  plugins: [],
}
