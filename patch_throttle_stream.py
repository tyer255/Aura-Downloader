import re

with open("server.ts", "r") as f:
    content = f.read()

# Make sure Transform is imported
if "import { Transform } from 'stream';" not in content:
    content = "import { Transform } from 'stream';\n" + content

# Define ThrottleStream class at the top level
throttle_class = """
class ThrottleStream extends Transform {
  private bytesPassed = 0;
  private startTime = Date.now();
  private maxBytesPerSecond: number;

  constructor(maxBytesPerSecond: number) {
    super();
    this.maxBytesPerSecond = maxBytesPerSecond;
  }

  _transform(chunk: any, encoding: string, callback: Function) {
    this.bytesPassed += chunk.length;
    
    const now = Date.now();
    const elapsed = (now - this.startTime) / 1000; // in seconds
    const expectedBytes = elapsed * this.maxBytesPerSecond;
    
    if (this.bytesPassed > expectedBytes) {
      const waitTime = ((this.bytesPassed - expectedBytes) / this.maxBytesPerSecond) * 1000;
      setTimeout(() => {
        this.push(chunk);
        callback();
      }, waitTime);
    } else {
      this.push(chunk);
      callback();
    }
  }
}
"""

if "class ThrottleStream extends Transform" not in content:
    content = content.replace("const app = express();", throttle_class + "\nconst app = express();")

# Replace response.pipe(res); in pipeUrlStream
target = """      response.pipe(res);
    });"""

replacement = """      if (throttleMBps > 0) {
        const bytesPerSecond = throttleMBps * 1024 * 1024;
        const throttler = new ThrottleStream(bytesPerSecond);
        response.pipe(throttler).pipe(res);
      } else {
        response.pipe(res);
      }
    });"""

if target in content:
    content = content.replace(target, replacement)
    print("Patched throttle stream logic")
else:
    print("Could not find target block for response.pipe(res);")

# Wait, let's also make sure pipeUrlStream passes throttleMBps to recursive calls.
# `pipeUrlStream(redirectUrl, res, customFilename, inline, maxRedirects - 1);`
content = content.replace(
    "pipeUrlStream(redirectUrl, res, customFilename, inline, maxRedirects - 1);",
    "pipeUrlStream(redirectUrl, res, customFilename, inline, maxRedirects - 1, throttleMBps);"
)

with open("server.ts", "w") as f:
    f.write(content)
