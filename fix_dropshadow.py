import re

with open("src/App.tsx", "r") as f:
    content = f.read()

content = content.replace('drop-shadow="0px 2px 4px rgba(0,0,0,0.2)"', 'style={{ filter: "drop-shadow(0px 2px 4px rgba(0,0,0,0.2))" }}')

with open("src/App.tsx", "w") as f:
    f.write(content)

print("Fixed drop shadow")
