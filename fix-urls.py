#!/usr/bin/env python3
import re
import os

files = [
    "frontend/app/page.tsx",
    "frontend/app/events/page.tsx",
    "frontend/app/events/[id]/page.tsx",
    "frontend/app/events/create/page.tsx",
    "frontend/components/StudyMaterialsWidget.tsx",
    "frontend/components/PartForm.tsx",
    "frontend/components/SourceSearch.tsx",
]

for filepath in files:
    if not os.path.exists(filepath):
        print(f"❌ File not found: {filepath}")
        continue
    
    with open(filepath, 'r') as f:
        content = f.read()
    
    original = content
    
    # Add import if not already there
    if "from '@/lib/api'" not in content and "'use client'" in content:
        content = content.replace("'use client'\n\n", "'use client'\n\nimport { getApiUrl } from '@/lib/api'\n\n", 1)
    
    # Replace hardcoded URLs in template strings
    # Pattern: `http://10.66.1.76:8080/api/something${variable}` -> `${getApiUrl('/something' + variable)}`
    # This handles backtick strings with embedded expressions
    
    # First, handle simple template strings without variables
    content = re.sub(
        r'`http://10\.66\.1\.76:8080/api([^$`]*)`',
        lambda m: f"`${{getApiUrl('{m.group(1)}')}}` ",
        content
    )
    
    # Then handle template strings with variables like `http://10.66.1.76:8080/api/events?${params}`
    content = re.sub(
        r'`http://10\.66\.1\.76:8080/api([^`]*)\$\{([^}]+)\}`',
        lambda m: f"`${{getApiUrl('{m.group(1)}'` + `${{{{ {m.group(2)} }}}}`",
        content
    )
    
    # Also handle single quotes
    content = re.sub(
        r"'http://10\.66\.1\.76:8080/api([^']*)'",
        r"getApiUrl('\1')",
        content
    )
    
    if content != original:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"✅ Updated: {filepath}")
    else:
        print(f"⏭️  No changes needed: {filepath}")
