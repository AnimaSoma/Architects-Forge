module.exports = {
  // Scan both `app` and `components` directories for Tailwind class names
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: '#58c4dc'
      },
      backdropBlur: {
        'nano': '2px'
      }
    }
  },
  plugins: []
};
