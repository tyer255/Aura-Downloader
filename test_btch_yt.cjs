const b = require('btch-downloader');
async function run() {
    console.log(await b.youtube("https://www.youtube.com/watch?v=dQw4w9WgXcQ"));
}
run();
