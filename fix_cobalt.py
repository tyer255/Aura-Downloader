import re

with open('server.ts', 'r') as f:
    content = f.read()

content = content.replace('''            thumbnail: data.url, // Default thumbnail to URL if missing''', '''            thumbnail: data.url && data.url.includes(".mp4") ? "" : data.url,''')

with open('server.ts', 'w') as f:
    f.write(content)
