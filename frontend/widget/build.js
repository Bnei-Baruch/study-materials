#!/usr/bin/env node

/**
 * Widget Bundle Builder
 * 
 * Builds the widget bundle using esbuild for optimal performance
 */

const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const isProduction = process.env.NODE_ENV === 'production';

// Ensure output directory exists
const outputDir = path.join(__dirname, '../public/widget');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log('Building Study Materials Widget...');
console.log('Environment:', isProduction ? 'production' : 'development');

// Build widget bundle
esbuild.build({
  entryPoints: [path.join(__dirname, 'index.tsx')],
  bundle: true,
  minify: isProduction,
  sourcemap: !isProduction,
  target: ['es2015'],
  format: 'iife',
  globalName: 'StudyMaterialsWidgetBundle',
  outfile: path.join(outputDir, 'widget.bundle.js'),
  define: {
    'process.env.NODE_ENV': JSON.stringify(isProduction ? 'production' : 'development'),
  },
  loader: {
    '.tsx': 'tsx',
    '.ts': 'ts',
  },
  external: [],
  logLevel: 'info',
}).then(() => {
  console.log('✓ Widget bundle built successfully');
  
  // Copy loader script
  fs.copyFileSync(
    path.join(__dirname, 'loader.js'),
    path.join(outputDir, 'widget.js')
  );
  console.log('✓ Loader script copied');
  
  // Build Tailwind CSS
  console.log('Building Tailwind CSS...');
  const { execSync } = require('child_process');
  try {
    execSync(
      `npx tailwindcss -c ${path.join(__dirname, 'tailwind.config.js')} -i ${path.join(__dirname, 'input.css')} -o ${path.join(outputDir, 'widget.css')} ${isProduction ? '--minify' : ''}`,
      { cwd: path.join(__dirname, '..'), stdio: 'inherit' }
    );
    console.log('✓ Widget styles built');
  } catch (error) {
    console.error('Failed to build Tailwind CSS:', error.message);
    process.exit(1);
  }
  
  // Generate bundle stats
  const bundleSize = fs.statSync(path.join(outputDir, 'widget.bundle.js')).size;
  const bundleSizeKB = (bundleSize / 1024).toFixed(2);
  const cssSize = fs.statSync(path.join(outputDir, 'widget.css')).size;
  const cssSizeKB = (cssSize / 1024).toFixed(2);
  
  console.log(`\nBundle size: ${bundleSizeKB} KB`);
  console.log(`CSS size: ${cssSizeKB} KB`);
  
  console.log('\nWidget files ready in:', outputDir);
  console.log('- widget.js (loader)');
  console.log('- widget.bundle.js (main bundle)');
  console.log('- widget.css (styles)');
}).catch((error) => {
  console.error('Build failed:', error);
  process.exit(1);
});

