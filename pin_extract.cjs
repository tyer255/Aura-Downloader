const axios = require('axios');

async function getPin(url) {
    try {
        const res = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
            }
        });
        
        const html = res.data;
        // Search for m3u8 or mp4
        const m3u8Matches = html.match(/https:\/\/[^"]+\.m3u8/g);
        const mp4Matches = html.match(/https:\/\/[^"]+\.mp4/g);
        
        console.log("M3U8:", m3u8Matches ? new Set(m3u8Matches) : null);
        console.log("MP4:", mp4Matches ? new Set(mp4Matches) : null);
        
        // Some pinterest videos are in application/ld+json
        const ldjsons = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
        for (const match of ldjsons) {
            try {
                const json = JSON.parse(match[1]);
                console.log(json.video);
            } catch(e){}
        }
    } catch(e) { console.error(e.message); }
}

getPin("https://in.pinterest.com/pin/821414419572621763/");
