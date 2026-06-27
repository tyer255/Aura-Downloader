import youtubedl from 'youtube-dl-exec';
async function test() {
    try {
        const url = 'https://www.instagram.com/reel/DEZc6oSSg7E/';
        const ytDlpOptions: any = {
            dumpSingleJson: true,
            noCheckCertificates: true,
            noWarnings: true,
            addHeader: [
              'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
            ]
        };
        const info: any = await youtubedl(url, ytDlpOptions);
        console.log("yt-dlp success:", info.title, info.url);
    } catch(e) {
        console.error("error:", e);
    }
}
test();
