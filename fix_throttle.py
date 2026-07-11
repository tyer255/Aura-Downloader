import re

with open("server.ts", "r") as f:
    content = f.read()

target = "function pipeUrlStream(fileUrl: string, res: any, customFilename: string, inline = false, maxRedirects = 5) {"
replacement = "function pipeUrlStream(fileUrl: string, res: any, customFilename: string, inline = false, maxRedirects = 5, throttleMBps = 0) {"

if target in content:
    content = content.replace(target, replacement)
    print("Fixed signature")
else:
    print("Signature not found. Let's try regex")
    content = re.sub(r'function pipeUrlStream\(.*?\)\s*\{', 'function pipeUrlStream(fileUrl: string, res: any, customFilename: string, inline = false, maxRedirects = 5, throttleMBps = 0) {', content)
    print("Regex replace")

with open("server.ts", "w") as f:
    f.write(content)

