/** @type {import('tailwindcss').Config} */
module.exports = {
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
  // All CSS is scoped to [data-studymaterials-widget] containers via input.css
  // The important selector ensures widget styles take precedence
  important: '[data-studymaterials-widget]',
}

