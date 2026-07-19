export async function getPinterestData(url: string) {
  try {
    const finalUrlResp = await fetch(url);
    url = finalUrlResp.url;
    console.log("Final URL:", url);
    
    // Check if it redirects to a pin
    // e.g. https://www.pinterest.com/pin/152911206093121543/
    const html = await finalUrlResp.text();
    
    const videoMatch = html.match(/<meta\s+property="og:video:url"\s+content="([^"]+)"/i) || 
                       html.match(/<meta\s+property="og:video:secure_url"\s+content="([^"]+)"/i) ||
                       html.match(/<meta\s+name="og:video"\s+content="([^"]+)"/i);
    const imageMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i) ||
                       html.match(/<meta\s+name="og:image"\s+content="([^"]+)"/i);
                       
    // Also extract __PWS_DATA__ if available
    const pwsMatch = html.match(/<script type="application\/json" id="__PWS_DATA__">([\s\S]*?)<\/script>/);
    let pwsData = null;
    if (pwsMatch) {
       pwsData = JSON.parse(pwsMatch[1]);
       require('fs').writeFileSync('pws_data.json', JSON.stringify(pwsData, null, 2));
    }
    
    // Relay Data?
    const relayMatch = html.match(/<script type="application\/json" id="__PWS_DATA__">([\s\S]*?)<\/script>/);
    
    return { video: videoMatch?.[1], image: imageMatch?.[1] };
  } catch (err) {
    console.error(err);
  }
}
getPinterestData('https://pin.it/2JmF6d9wN').then(console.log);
