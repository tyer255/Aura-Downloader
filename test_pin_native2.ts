export async function test(url: string) {
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
    console.log("Resolved URL:", url);
}
test('https://pin.it/1DqwzT0');
