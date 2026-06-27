import youtubedl from 'youtube-dl-exec';
async function test() {
    try {
        const res = await youtubedl('https://www.instagram.com/reel/DEZc6oSSg7E/', {
            dumpSingleJson: true,
            noCheckCertificates: true,
            noWarnings: true,
            preferFreeFormats: true,
            addHeader: ['referer:youtube.com', 'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64)']
        });
        console.log(Object.keys(res));
    } catch(e) {
        console.error(e);
    }
}
test();
