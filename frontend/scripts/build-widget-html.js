#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Get API URL from environment variable
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// Read the template (scripts is in frontend/scripts, so go up to frontend, then to public)
const templatePath = path.join(__dirname, '..', 'public', 'widget-simple.template.html');
let html = fs.readFileSync(templatePath, 'utf-8');

// Replace the placeholder with the actual API URL
html = html.replace('{{API_URL}}', apiUrl);

// Write the generated HTML
const outputPath = path.join(__dirname, '..', 'public', 'widget-simple.html');
fs.writeFileSync(outputPath, html);

console.log(`✓ Generated widget-simple.html with API URL: ${apiUrl}`);



