const youtubedl = require('youtube-dl-exec');
async function test() {
    const res = await youtubedl('ytsearch1:shape of you ed sheeran audio', {
        dumpSingleJson: true,
        noWarnings: true
    });
    console.log(res.entries[0].url || res.entries[0].webpage_url);
    console.log(res.entries[0].title);
}
test();
