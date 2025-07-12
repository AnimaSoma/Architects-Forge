/* Tailwind configuration – extended for Architects-Forge mobile-first styling */
const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    /* ────────────────────────────────────────────
       Custom theme extensions
    ──────────────────────────────────────────── */
    extend: {
      /* 1.  Colour palette consistent with site gradients */
      colors: {
        brand: {
          blue:  '#1e3a8a',   // indigo-900
          purple:'#4c1d95',   // purple-900
          pink:  '#be185d',   // pink-700
          accent:'#34d399',   // emerald-400
        },
      },

      /* 2.  Extra small breakpoint for tighter mobile control */
      screens: {
        xs: '480px',
        ...defaultTheme.screens,   // keep default sm/md/lg…
      },

      /* 3.  Misc mobile-friendly tweaks */
      container: {
        center: true,
        padding: {
          DEFAULT: '1rem',
          sm: '1.5rem',
          lg: '2rem',
        },
      },

      spacing: {
        18: '4.5rem',   // sometimes handy (72px)
      },

      blur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
