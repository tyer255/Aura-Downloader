import re
with open("src/App.tsx", "r") as f:
    content = f.read()

content = content.replace("<button type=\"button\"\n                                        id={idx === 0 ? \"tour-regular-download\" : undefined}", "<button type=\"button\"")
with open("src/App.tsx", "w") as f:
    f.write(content)
