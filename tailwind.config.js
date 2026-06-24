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
          navy: "#000000",     /* App Background - OLED Black */
          orange: "#FF5A36",   /* Primary Action - Vibrant Coral */
          light: "#FAFAFA",    /* Text Primary */
          dark: "#09090B",     /* Card Surface - Zinc 950 */
          accent: "#18181B"    /* Card Border / Secondary Surface */
        }
      },
      fontFamily: {
        sans: ["Space Grotesk", "sans-serif"],
      }
    },
  },
  plugins: [],
}
