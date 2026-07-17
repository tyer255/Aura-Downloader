import re

with open('server.ts', 'r') as f:
    content = f.read()

# Fix extractWithCobalt picker case
old_picker = """        if (data.status === "picker") {
          // Multiple items
          const media = data.picker.map((item: any) => ({
            type: item.type === "video" ? "video" : "image",
            url: item.url,
            thumbnail: item.thumb || ""
          }));
          return {
            success: true,
            title: "Extracted Media",
            url: media[0]?.url,
            mediaType: media[0]?.type,
            media: media
          };
        }"""
new_picker = """        if (data.status === "picker") {
          // Multiple items
          const media = data.picker.map((item: any) => ({
            type: item.type === "video" ? "video" : "image",
            url: item.url,
            thumbnail: item.thumb || ""
          }));
          const primary = media[0];
          return {
            success: true,
            title: "Extracted Media",
            thumbnail: primary?.thumbnail || primary?.url,
            url: primary?.url,
            mediaType: media.length > 1 ? "carousel" : primary?.type,
            media: media,
            qualities: primary?.type === "video" ? getFallbackQualities(primary?.url, "video") : undefined
          };
        }"""
content = content.replace(old_picker, new_picker)

# Fix extractWithCobalt Ryzen case
old_ryzen = """        if (isRyzen && data.data && data.data.length > 0) {
           return {
             success: true,
             title: "Instagram Video",
             url: data.data[0].url,
             mediaType: "video",
             qualities: getFallbackQualities(data.data[0].url, "video"),
             media: data.data.map((m: any) => ({ type: "video", url: m.url, thumbnail: m.thumbnail || "" }))
           };
        }"""
new_ryzen = """        if (isRyzen && data.data && data.data.length > 0) {
           const media = data.data.map((m: any) => ({ type: "video", url: m.url, thumbnail: m.thumbnail || "" }));
           const primary = media[0];
           return {
             success: true,
             title: "Instagram Video",
             thumbnail: primary.thumbnail || primary.url,
             url: primary.url,
             mediaType: media.length > 1 ? "carousel" : "video",
             qualities: getFallbackQualities(primary.url, "video"),
             media: media
           };
        }"""
content = content.replace(old_ryzen, new_ryzen)

# Fix extractWithCobalt stream/redirect case
old_stream = """        if (data.status === "redirect" || data.status === "stream" || data.status === "success") {
          return {
            success: true,
            title: "Extracted Media",
            url: data.url,
            mediaType: "video",
            qualities: getFallbackQualities(data.url, "video"),
            media: [{ type: "video", url: data.url }]
          };
        }"""
new_stream = """        if (data.status === "redirect" || data.status === "stream" || data.status === "success") {
          return {
            success: true,
            title: "Extracted Media",
            thumbnail: data.url, // Default thumbnail to URL if missing
            url: data.url,
            mediaType: "video",
            qualities: getFallbackQualities(data.url, "video"),
            media: [{ type: "video", url: data.url, thumbnail: data.url }]
          };
        }"""
content = content.replace(old_stream, new_stream)

# Fix extractInstagramBtch case
old_btch = """      return {
        success: true,
        data: {
          title: primary.type === "video" ? "Instagram Reel" : "Instagram Post",
          thumbnail: primary.thumbnail,
          url: primary.url,
          mediaType: primary.type,
          media,
          qualities
        }
      };"""
new_btch = """      return {
        success: true,
        data: {
          title: primary.type === "video" ? "Instagram Reel" : "Instagram Post",
          thumbnail: primary.thumbnail || primary.url,
          url: primary.url,
          mediaType: media.length > 1 ? "carousel" : primary.type,
          media,
          qualities
        }
      };"""
content = content.replace(old_btch, new_btch)

with open('server.ts', 'w') as f:
    f.write(content)
