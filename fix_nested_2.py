import re

with open('server.ts', 'r') as f:
    content = f.read()

content = content.replace('''
      return {
        success: true,
        data: {
          title: type === "video" ? "Instagram Reel" : "Instagram Post",
          thumbnail: thumbUrl,
          url: mediaUrl,
          mediaType: type,
          media: [{ type, url: mediaUrl, thumbnail: thumbUrl }],
          qualities
        }
      };''', '''
      return {
        success: true,
        title: type === "video" ? "Instagram Reel" : "Instagram Post",
        thumbnail: thumbUrl,
        url: mediaUrl,
        mediaType: type,
        media: [{ type, url: mediaUrl, thumbnail: thumbUrl }],
        qualities
      };''')

with open('server.ts', 'w') as f:
    f.write(content)
