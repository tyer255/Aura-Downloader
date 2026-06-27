import { ytmp4 } from '@vreden/youtube_scraper';

async function test() {
    try {
        const res = await fetch('http://localhost:3000/api/ig-media', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: 'https://www.instagram.com/reel/DEZc6oSSg7E/' })
        });
        console.log(res.status, await res.text());
    } catch(e) {
        console.error(e);
    }
}
test();
