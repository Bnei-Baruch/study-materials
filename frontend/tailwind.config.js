/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: {
    files: [
      "./app/**/*.{js,ts,jsx,tsx,mdx}",
      "./components/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    // Strip JS regex literals before Tailwind scans for class names,
    // preventing patterns like /[-:.]/g from being misread as arbitrary CSS properties.
    transform: {
      ts: (content) => content.replace(/\/\[([^\]]*)\]\/[gimsuy]*/g, ''),
      tsx: (content) => content.replace(/\/\[([^\]]*)\]\/[gimsuy]*/g, ''),
      js: (content) => content.replace(/\/\[([^\]]*)\]\/[gimsuy]*/g, ''),
      jsx: (content) => content.replace(/\/\[([^\]]*)\]\/[gimsuy]*/g, ''),
    },
  },
  theme: {
    extend: {},
  },
  plugins: [],
}


