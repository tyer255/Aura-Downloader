import re
with open("server.ts", "r") as f:
    content = f.read()

target = """  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    next();
  });"""

replacement = """  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    next();
  });

  app.get("/api/ping", (req, res) => {
    res.status(200).send("ok");
  });"""

content = content.replace(target, replacement)
with open("server.ts", "w") as f:
    f.write(content)
