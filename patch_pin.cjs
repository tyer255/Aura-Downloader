const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const nativeFunc = `
async function extractPinterestNative(url: string) {
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
    
    if (!url.includes('/pin/')) return null;

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      }
    });
    const html = await res.text();
    
    let videoUrl = "";
    let imageUrl = "";
    let title = "Pinterest Video";
    
    const match = html.match(/<script data-relay-response="[^"]+" type="application\\/json">([\\s\\S]*?)<\\/script>/g);
    if (match) {
        for (const m of match) {
            const jsonMatch = m.match(/<script[^>]*>([\\s\\S]*?)<\\/script>/);
            if (jsonMatch) {
                try {
                    const data = JSON.parse(jsonMatch[1]);
                    const strData = JSON.stringify(data);
                    
                    const mp4Regex = /"(https:\\/\\/[^"]+\\.mp4[^"]*)"/g;
                    let mUrl;
                    while ((mUrl = mp4Regex.exec(strData)) !== null) {
                        if (mUrl[1] && !mUrl[1].includes('trailer') && !mUrl[1].includes('hls')) {
                            videoUrl = mUrl[1];
                        }
                    }
                    if (!videoUrl && strData.includes('.m3u8')) {
                       const m3u8Regex = /"(https:\\/\\/[^"]+\\.m3u8[^"]*)"/g;
                       const mm = m3u8Regex.exec(strData);
                       if (mm) videoUrl = mm[1];
                    }
                    
                    const titleRegex = /"title":"([^"]+)"/;
                    const tMatch = titleRegex.exec(strData);
                    if (tMatch && tMatch[1]) title = tMatch[1];
                    
                    const imgRegex = /"imageLargeUrl":"([^"]+)"/;
                    const iMatch = imgRegex.exec(strData);
                    if (iMatch && iMatch[1]) imageUrl = iMatch[1];
                } catch(e) {}
            }
        }
    }
    
    if (!videoUrl) {
       const pwsMatch = html.match(/<script id="__PWS_DATA__" type="application\\/json">([\\s\\S]*?)<\\/script>/);
       if (pwsMatch) {
          try {
              const data = JSON.parse(pwsMatch[1]);
              const strData = JSON.stringify(data);
              const mp4Regex = /"(https:\\/\\/[^"]+\\.mp4[^"]*)"/g;
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
    
    if (!videoUrl) {
       const vMatch = html.match(/<meta\\s+property="og:video:url"\\s+content="([^"]+)"/i) || 
                      html.match(/<meta\\s+name="og:video"\\s+content="([^"]+)"/i);
       if (vMatch && vMatch[1]) videoUrl = vMatch[1].replace(/&amp;/g, '&');
    }
    if (!imageUrl) {
       const imgMatch = html.match(/<meta\\s+property="og:image"\\s+content="([^"]+)"/i) ||
                        html.match(/<meta\\s+name="og:image"\\s+content="([^"]+)"/i);
       if (imgMatch && imgMatch[1]) imageUrl = imgMatch[1].replace(/&amp;/g, '&');
    }
    
    if (videoUrl) {
        return {
           success: true,
           title: title || "Pinterest Video",
           thumbnail: imageUrl || "",
           url: videoUrl,
           mediaType: "video",
           qualities: getFallbackQualities(videoUrl, "video"),
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
    console.log("extractPinterestNative error:", err);
    return null;
  }
}
`;

if (!code.includes('extractPinterestNative')) {
    code = code.replace('async function extractPinterestBtch', nativeFunc + '\nasync function extractPinterestBtch');
}

const replacementRoute = `
        if (platform === 'pinterest') {
            console.log("Trying native extractor for Pinterest...");
            const nativeResult = await extractPinterestNative(trimmedUrl);
            if (nativeResult && nativeResult.success && nativeResult.mediaType === 'video') {
                return res.json(nativeResult);
            }
            console.log("Trying yt-dlp for Pinterest...");
            const ytResult = await extractWithYtDlp(trimmedUrl);
            if (ytResult && ytResult.success && ytResult.mediaType === 'video') {
                return res.json(ytResult);
            }
            console.log("yt-dlp failed or not a video, falling back to btch-downloader for Pinterest...");
            const pinResult = await extractPinterestBtch(trimmedUrl);
            if (pinResult && pinResult.success) {
                return res.json(pinResult);
            }
            if (ytResult && ytResult.success) {
                return res.json(ytResult);
            }
            if (nativeResult && nativeResult.success) {
                return res.json(nativeResult);
            }
        }`;

code = code.replace(/if\s*\(platform\s*===\s*'pinterest'\)\s*\{\s*console\.log\("Trying yt-dlp for Pinterest[\s\S]*?if\s*\(ytResult && ytResult\.success\)\s*\{\s*return res\.json\(ytResult\);\s*\}\s*\}/m, replacementRoute.trim());

fs.writeFileSync('server.ts', code);
console.log('patched');
