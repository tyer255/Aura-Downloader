import re

with open("server.ts", "r") as f:
    content = f.read()

target = r'(  if \(process\.env\.NODE_ENV !== "production"\) \{)'
replacement = r'''  app.get("/api/health", (req, res) => {
    res.status(200).send("OK");
  });

\1'''

content = re.sub(target, replacement, content)

with open("server.ts", "w") as f:
    f.write(content)

print("Injected health route")
