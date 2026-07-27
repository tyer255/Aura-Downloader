const { ytmp3 } = require('@vreden/youtube_scraper');
async function test() {
    try {
        console.log("Calling ytmp3...");
        const res = await ytmp3('https://www.youtube.com/watch?v=_dK2tDK9grQ'); // Shape of you
        console.log(res);
    } catch(e) {
        console.error("Error:", e);
    }
}
test();
