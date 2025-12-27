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
  
  // Copy CSS
  fs.copyFileSync(
    path.join(__dirname, 'widget.css'),
    path.join(outputDir, 'widget.css')
  );
  console.log('✓ Widget styles copied');
  
  // Generate bundle stats
  const bundleSize = fs.statSync(path.join(outputDir, 'widget.bundle.js')).size;
  const bundleSizeKB = (bundleSize / 1024).toFixed(2);
  console.log(`\nBundle size: ${bundleSizeKB} KB`);
  
  console.log('\nWidget files ready in:', outputDir);
  console.log('- widget.js (loader)');
  console.log('- widget.bundle.js (main bundle)');
  console.log('- widget.css (styles)');
}).catch((error) => {
  console.error('Build failed:', error);
  process.exit(1);
});
