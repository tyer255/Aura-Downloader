const { ytmp4, ytmp3 } = require('@vreden/youtube_scraper');
async function test() {
    console.time("parallel");
    const url = "https://www.youtube.com/watch?v=jNQXAC9IVRw";
    const qualities = [144, 360, 480, 720, 1080];
    const promises = qualities.map(q => ytmp4(url, q));
    promises.push(ytmp3(url, 128));
    const results = await Promise.all(promises);
    console.timeEnd("parallel");
    console.log(results.map(r => r?.download?.url));
}
test();
