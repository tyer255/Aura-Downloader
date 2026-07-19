export async function getPinterestData(url: string) {
  try {
    // resolve short url
    if (url.includes('pin.it')) {
      const resp = await fetch(url, { redirect: 'manual' });
      if (resp.status >= 300 && resp.status < 400) {
        url = resp.headers.get('location') || url;
      }
    }
    console.log("Resolved URL:", url);
    
    // fetch full URL
    const htmlResp = await fetch(url);
    const html = await htmlResp.text();
    
    // Check for JSON inside the html, usually <script type="application/json" id="__PWS_DATA__"> or similar
    const jsonMatch = html.match(/<script type="application\/json" id="__PWS_DATA__">([\s\S]*?)<\/script>/);
    let jsonData = null;
    if (jsonMatch) {
       jsonData = JSON.parse(jsonMatch[1]);
       console.log("Got __PWS_DATA__");
    } else {
       // Check for next.js data
       const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
       if (nextDataMatch) {
          jsonData = JSON.parse(nextDataMatch[1]);
          console.log("Got __NEXT_DATA__");
       }
    }
    
    // Or check og:video meta tags
    const videoMatch = html.match(/<meta property="og:video"[^>]*content="([^"]+)"/);
    if (videoMatch) {
       console.log("Got og:video", videoMatch[1]);
    }
    const videoMatch2 = html.match(/<meta property="og:video:url"[^>]*content="([^"]+)"/);
    if (videoMatch2) {
       console.log("Got og:video:url", videoMatch2[1]);
    }
    const imgMatch = html.match(/<meta property="og:image"[^>]*content="([^"]+)"/);
    
    return { jsonData: jsonData ? "Yes" : "No", video: videoMatch?.[1] || videoMatch2?.[1], image: imgMatch?.[1] };
  } catch (err) {
    console.error(err);
  }
}
getPinterestData('https://pin.it/2JmF6d9wN').then(console.log);
