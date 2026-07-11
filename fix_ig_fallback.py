import re

with open("server.ts", "r") as f:
    content = f.read()

target = '''    if (isProfile) {
      let username = "user";
      if (url.includes("@")) {
        username = "@" + url.split("@")[1].split("/")[0].split("?")[0];
      } else {
        const segments = url.split("/").filter(Boolean);
        username = segments[segments.length - 1] || "user";
      }
      
      const displayName = title.split(" (")[0] || title;'''

replacement = '''    if (isProfile) {
      let username = "user";
      if (url.includes("@")) {
        username = "@" + url.split("@")[1].split("/")[0].split("?")[0];
      } else {
        const segments = url.split("/").filter(Boolean);
        username = segments[segments.length - 1] || "user";
      }
      
      const displayName = (title && title !== "Social Media Post" && !title.includes("404") && !title.includes("Not Found")) ? title.split(" (")[0] : username;'''

if target in content:
    content = content.replace(target, replacement)
    with open("server.ts", "w") as f:
        f.write(content)
    print("Replaced displayName successfully")
else:
    print("Target displayName not found")
