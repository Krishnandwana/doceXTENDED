/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#EF4444', // red-600
      }
    },
  },
  plugins: [],
  important: true, // To override Material-UI styles where needed
}
