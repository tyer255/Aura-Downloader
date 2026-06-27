async function test() {
    try {
        const url = 'https://www.instagram.com/reel/DEZc6oSSg7E/';
        const res = await fetch('https://igram.world/api/v1/instagram/?url=' + encodeURIComponent(url), {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
            }
        });
        const html = await res.text();
        console.log("status:", res.status, "body:", html.substring(0, 500));
    } catch(e) {
        console.error(e);
    }
}
test();
