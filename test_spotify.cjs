const spotify = require('spotify-url-info')(fetch);
const YouTube = require('youtube-sr').default;

async function test() {
    try {
        const url = 'https://open.spotify.com/track/6RQWEYRUGqTavHl40j6uYp'; // Shape of you
        const data = await spotify.getData(url);
        console.log("Spotify Title:", data.name);
        console.log("Spotify Artist:", data.artists.map(a => a.name).join(', '));
        console.log("Spotify Thumb:", data.coverArt?.sources?.[0]?.url);
        
        const searchStr = `${data.name} ${data.artists[0].name} audio`;
        console.log("Searching YT:", searchStr);
        
        const ytRes = await YouTube.searchOne(searchStr);
        console.log("YT ID:", ytRes.id);
        console.log("YT URL:", ytRes.url);
    } catch(e) {
        console.error("Error:", e);
    }
}
test();
