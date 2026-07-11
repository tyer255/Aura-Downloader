import re

with open("src/App.tsx", "r") as f:
    content = f.read()

target = "const handleDownload = async (e: React.FormEvent) => {"
replacement = """const handleDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!navigator.onLine) {
      alert("PLEASE CONNECT YOUR NETWORK FIRST THAN RETRY");
      return;
    }
"""

if target in content:
    content = content.replace(
        "const handleDownload = async (e: React.FormEvent) => {\n    e.preventDefault();",
        replacement
    )
    with open("src/App.tsx", "w") as f:
        f.write(content)
    print("Patched handleDownload for offline check.")
else:
    print("Could not find handleDownload.")
