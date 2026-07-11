import re

with open("server.ts", "r") as f:
    content = f.read()

target = "pipeUrlStream(fileUrl as string, res, customFilename as string, inline);"
replacement = """
      const throttleMBps = req.query.throttle && req.query.throttle !== 'unlimited' ? parseInt(req.query.throttle as string, 10) : 0;
      pipeUrlStream(fileUrl as string, res, customFilename as string, inline, 5, throttleMBps);
"""

if target in content:
    content = content.replace(target, replacement)
    with open("server.ts", "w") as f:
        f.write(content)
    print("Fixed pipeUrlStream call")
else:
    print("Could not find call")

