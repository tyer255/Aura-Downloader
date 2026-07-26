import youtubedl from 'youtube-dl-exec';
async function run() {
    try {
        const data = await youtubedl("https://www.youtube.com/watch?v=jNQXAC9IVRw", {
            dumpSingleJson: true,
            noWarnings: true,
            noCheckCertificate: true,
            preferFreeFormats: true,
            youtubeSkipDashManifest: true,
            youtubeSkipHlsManifest: true,
            noCheckFormats: true,
            checkFormats: "no"
        });
        console.log(data.title, data.formats?.length);
    } catch(e) { console.error(e) }
}
run();
