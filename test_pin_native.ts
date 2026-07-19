export async function extractPinterestNative(url: string) {
  try {
    if (url.includes('pin.it')) {
      const resp = await fetch(url, { redirect: 'manual' });
      if (resp.status >= 300 && resp.status < 400) {
        url = resp.headers.get('location') || url;
        if (url.includes('api.pinterest.com/url_shortener')) {
           const redirectResp = await fetch(url, { redirect: 'manual' });
           if (redirectResp.status >= 300 && redirectResp.status < 400) {
              url = redirectResp.headers.get('location') || url;
           }
        }
      }
    }
    
    // Make sure we have a proper pin URL
    if (!url.includes('/pin/')) return null;

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      }
    });
    const html = await res.text();
    
    
    // Look for video in relay response or __PWS_DATA__
    let videoUrl = "";
    let imageUrl = "";
    let title = "Pinterest Video";
    
    // Check relay responses
    const match = html.match(/<script data-relay-response="[^"]+" type="application\/json">([\s\S]*?)<\/script>/g);
    if (match) {
        for (const m of match) {
            const jsonMatch = m.match(/<script[^>]*>([\s\S]*?)<\/script>/);
            if (jsonMatch) {
                try {
                    const data = JSON.parse(jsonMatch[1]);
                    const strData = JSON.stringify(data);
                    
                    // Simple string search for .mp4 URLs
                    const mp4Regex = /"(https:\/\/[^"]+\.mp4[^"]*)"/g;
                    let mUrl;
                    while ((mUrl = mp4Regex.exec(strData)) !== null) {
                        if (mUrl[1] && !mUrl[1].includes('trailer') && !mUrl[1].includes('hls')) {
                            videoUrl = mUrl[1];
                        }
                    }
                    if (!videoUrl && strData.includes('.m3u8')) {
                       const m3u8Regex = /"(https:\/\/[^"]+\.m3u8[^"]*)"/g;
                       const mm = m3u8Regex.exec(strData);
                       if (mm) videoUrl = mm[1];
                    }
                    
                    // Title
                    const titleRegex = /"title":"([^"]+)"/;
                    const tMatch = titleRegex.exec(strData);
                    if (tMatch && tMatch[1]) title = tMatch[1];
                    
                    // Image
                    const imgRegex = /"imageLargeUrl":"([^"]+)"/;
                    const iMatch = imgRegex.exec(strData);
                    if (iMatch && iMatch[1]) imageUrl = iMatch[1];
                } catch(e) {}
            }
        }
    }
    
    // Fallback: Check __PWS_DATA__
    if (!videoUrl) {
       const pwsMatch = html.match(/<script id="__PWS_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
       if (pwsMatch) {
          try {
              const data = JSON.parse(pwsMatch[1]);
              const strData = JSON.stringify(data);
              const mp4Regex = /"(https:\/\/[^"]+\.mp4[^"]*)"/g;
              let mUrl;
              while ((mUrl = mp4Regex.exec(strData)) !== null) {
                  if (mUrl[1] && !mUrl[1].includes('trailer') && !mUrl[1].includes('hls')) {
                      videoUrl = mUrl[1];
                  }
              }
              
              if (!imageUrl) {
                 const imgRegex = /"imageLargeUrl":"([^"]+)"/;
                 const iMatch = imgRegex.exec(strData);
                 if (iMatch && iMatch[1]) imageUrl = iMatch[1];
              }
          } catch(e) {}
       }
    }
    
    // Fallback: Check og:video
    if (!videoUrl) {
       const vMatch = html.match(/<meta\s+property="og:video:url"\s+content="([^"]+)"/i) || 
                      html.match(/<meta\s+name="og:video"\s+content="([^"]+)"/i);
       if (vMatch && vMatch[1]) videoUrl = vMatch[1].replace(/&amp;/g, '&');
    }
    if (!imageUrl) {
       const imgMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i) ||
                        html.match(/<meta\s+name="og:image"\s+content="([^"]+)"/i);
       if (imgMatch && imgMatch[1]) imageUrl = imgMatch[1].replace(/&amp;/g, '&');
    }
    
    if (videoUrl) {
        return {
           success: true,
           title: title || "Pinterest Video",
           thumbnail: imageUrl || "",
           url: videoUrl,
           mediaType: "video",
           media: [{ type: "video", url: videoUrl, thumbnail: imageUrl || "" }]
        };
    } else if (imageUrl) {
        return {
           success: true,
           title: title || "Pinterest Image",
           thumbnail: imageUrl || "",
           url: imageUrl,
           mediaType: "image",
           media: [{ type: "image", url: imageUrl, thumbnail: imageUrl || "" }]
        };
    }
    
    return null;
  } catch (err) {
    console.error("extractPinterestNative error", err);
    return null;
  }
}

extractPinterestNative('https://pin.it/1DqwzT0').then(res => console.log(JSON.stringify(res, null, 2)));
