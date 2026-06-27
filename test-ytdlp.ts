import youtubedl from 'youtube-dl-exec';
async function test() {
    try {
        const res = await youtubedl('https://www.instagram.com/reel/C-U8h5QoQ1k/', {
            dumpJson: true,
            noWarnings: true,
        });
        console.log("res:", typeof res === 'string' ? JSON.parse(res).url : (res as any).url);
    } catch(e) {
        console.error(e.message);
    }
}
test();
