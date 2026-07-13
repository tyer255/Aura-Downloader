import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# Add import
import_stmt = "import ReloadPrompt from './components/ReloadPrompt';\n"
if "import ReloadPrompt" not in content:
    content = re.sub(r'(import [^\n]+;\n)', r'\1' + import_stmt, content, count=1)

# Add component before </LazyMotion>
target = r'(\s*)<\/LazyMotion>\s*<\/>'
replacement = r'\1  <ReloadPrompt isLight={isLight} />\n\1</LazyMotion>\n\1</>'

content = re.sub(target, replacement, content)

with open("src/App.tsx", "w") as f:
    f.write(content)

print("Injected ReloadPrompt")
