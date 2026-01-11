#!/bin/bash

# Fix all hardcoded API URLs in frontend

files=(
  "frontend/app/page.tsx"
  "frontend/app/events/page.tsx"
  "frontend/app/events/[id]/page.tsx"
  "frontend/app/events/create/page.tsx"
  "frontend/components/StudyMaterialsWidget.tsx"
  "frontend/components/PartForm.tsx"
  "frontend/components/SourceSearch.tsx"
)

for file in "${files[@]}"; do
  echo "Processing $file..."
  
  # Add import if not exists
  if ! grep -q "from '@/lib/api'" "$file"; then
    sed -i "1s/^/'use client'\n\nimport { getApiUrl } from '@\/lib\/api'\n\n/" "$file"
  fi
  
  # Replace all hardcoded URLs
  perl -pi -e "s|'http://10\.66\.1\.76:8080/api([^'\"]*)'|getApiUrl('\$1')|g" "$file"
  perl -pi -e 's|`http://10\.66\.1\.76:8080/api([^`]*)`|`\${getApiUrl("\$1")}`|g' "$file"
done

echo "Done!"





