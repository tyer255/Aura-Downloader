const scraper = require('@vreden/youtube_scraper');
async function run() {
    try {
        let res = await scraper.ytmp4('https://www.youtube.com/watch?v=jNQXAC9IVRw');
        console.log(res);
    } catch(e) {
        console.error(e);
    }
}
run();
