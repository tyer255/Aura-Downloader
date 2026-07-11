import re

with open("server.ts", "r") as f:
    content = f.read()

if "import axios" not in content:
    content = "import axios from 'axios';\n" + content
    with open("server.ts", "w") as f:
        f.write(content)
    print("Added axios import")
else:
    print("Already imported")
