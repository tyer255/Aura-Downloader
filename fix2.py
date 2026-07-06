import re

with open('server.ts', 'r') as f:
    content = f.read()

# Fix the stray if statement
content = content.replace(
    'if (!directUrl && !isProfile) {\n     const mediaType',
    'const mediaType'
)

# Move imports to top
imports = re.findall(r"^import\s+.*?;", content, re.MULTILINE)
for imp in imports:
    if 'child_process' in imp or 'util' in imp:
        content = content.replace(imp, '')

# prepend imports
new_imports = "import { exec } from 'child_process';\nimport utilSync from 'util';\n"
content = new_imports + content

# Also, the `const execAsync = utilSync.promisify(exec);` can stay where it is.

with open('server.ts', 'w') as f:
    f.write(content)

