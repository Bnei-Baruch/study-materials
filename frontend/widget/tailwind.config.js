/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './components/EmbeddedEventsList.tsx',
    './components/EmbeddedLessonSidebar.tsx',
    './components/StudyMaterialsWidget.tsx',
    './widget/index.tsx',
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  important: '[data-studymaterials-widget]',
}

