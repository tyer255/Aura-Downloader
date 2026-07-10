with open("server.ts", "r") as f:
    lines = f.readlines()

for i in range(len(lines)):
    if "const encodedFilename =" in lines[i]:
        lines[i] = "      const encodedFilename = encodeURIComponent((customFilename as string).replace(/[\\r\\n]+/g, ''));\n"

with open("server.ts", "w") as f:
    f.writelines(lines)
