import re

with open("server.ts", "r") as f:
    content = f.read()

# 1. Update pipeUrlStream signature and call
if "function pipeUrlStream(fileUrl: string, res: any, customFilename: string, inline = false, maxRedirects = 5" in content:
    content = content.replace(
        "function pipeUrlStream(fileUrl: string, res: any, customFilename: string, inline = false, maxRedirects = 5) {",
        "function pipeUrlStream(fileUrl: string, res: any, customFilename: string, inline = false, maxRedirects = 5, throttleMBps = 0) {"
    )

if "pipeUrlStream(fileUrl as string, res, customFilename as string, inline);" in content:
    content = content.replace(
        "pipeUrlStream(fileUrl as string, res, customFilename as string, inline);",
        """
      const throttleMBps = req.query.throttle && req.query.throttle !== 'unlimited' ? parseInt(req.query.throttle as string, 10) : 0;
      pipeUrlStream(fileUrl as string, res, customFilename as string, inline, 5, throttleMBps);
        """
    )

# 2. Add Throttle stream logic inside pipeUrlStream
# find `response.pipe(res);`
# it's probably `response.pipe(res);` inside `pipeUrlStream`
# Let's search for how pipeUrlStream pipes it.
