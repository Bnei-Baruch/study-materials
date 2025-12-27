/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './components/EmbeddedEventsList.tsx',
    './components/EmbeddedLessonSidebar.tsx',
    './components/StudyMaterialsWidget.tsx',
    './widget/index.tsx',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  // Prefix all classes to avoid conflicts
  prefix: '',
  important: '[data-studymaterials-widget]',
}
