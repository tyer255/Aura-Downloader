import re

with open("server.ts", "r") as f:
    content = f.read()

target = '''    if (isPlaylist) {
       args = `--js-runtimes node --dump-single-json --flat-playlist "${url}"`;
    }'''

replacement = '''    if (isPlaylist) {
       args = `--js-runtimes node --dump-single-json --flat-playlist --playlist-end 15 "${url}"`;
    }'''

if target in content:
    content = content.replace(target, replacement)
    with open("server.ts", "w") as f:
        f.write(content)
    print("Replaced args successfully")
else:
    print("Target args not found")
