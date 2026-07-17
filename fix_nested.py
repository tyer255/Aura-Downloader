import re

with open('server.ts', 'r') as f:
    content = f.read()

# Fix extractInstagramBtch
content = content.replace('''
      return {
        success: true,
        data: {
          title: primary.type === "video" ? "Instagram Reel" : "Instagram Post",
          thumbnail: primary.thumbnail || primary.url,
          url: primary.url,
          mediaType: media.length > 1 ? "carousel" : primary.type,
          media,
          qualities
        }
      };''', '''
      return {
        success: true,
        title: primary.type === "video" ? "Instagram Reel" : "Instagram Post",
        thumbnail: primary.thumbnail || primary.url,
        url: primary.url,
        mediaType: media.length > 1 ? "carousel" : primary.type,
        media,
        qualities
      };''')

# Fix extractInstagramRapidAPI (this doesn't return nested, it returns flat, but wait, it's not even called, but let's check it anyway)

# In /api/download, fix the Twitter returns
content = content.replace('''return res.json({ success: true, data: rapidResult });''', '''return res.json({ success: true, ...rapidResult });''')

content = content.replace('''return res.json({ success: true, data: xtractorResult });''', '''return res.json({ success: true, ...xtractorResult });''')

# Wait, what if xtractorResult already has success? That's fine, ...xtractorResult will overwrite or include it.

with open('server.ts', 'w') as f:
    f.write(content)
