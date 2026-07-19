export async function getPinterestData(url: string) {
  try {
    const finalUrlResp = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
      }
    });
    console.log("Final URL:", finalUrlResp.url);
    const html = await finalUrlResp.text();
    require('fs').writeFileSync('pin.html', html);
    
    // ...
  } catch (err) {
    console.error(err);
  }
}
getPinterestData('https://pin.it/2JmF6d9wN');
