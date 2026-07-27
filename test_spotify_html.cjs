const axios = require('axios');

async function test() {
    try {
        const url = 'https://open.spotify.com/track/7qiZfU4dY1lWllzX7mPBI3'; 
        const res = await axios.get(url, {
            headers: { 'User-Agent': 'curl/7.88.1' }
        });
        const html = res.data;
        const nextMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json".*?>(.*?)<\/script>/);
        if (nextMatch) {
            console.log("Next data:", nextMatch[1].substring(0, 200));
        } else {
            console.log("No NEXT_DATA found.");
        }
    } catch(e) {
        console.error("Error:", e.message);
    }
}
test();
