const spotify = require('spottydl');
async function test() {
    try {
        const url = 'https://open.spotify.com/track/6RQWEYRUGqTavHl40j6uYp'; // Shape of you
        const track = await spotify.getTrack(url);
        console.log("Track:", track);
    } catch(e) {
        console.error("Error:", e);
    }
}
test();
