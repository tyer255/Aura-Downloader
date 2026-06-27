import play from 'play-dl';

async function test() {
    try {
        const info = await play.video_info('https://www.youtube.com/watch?v=aqz-KE-bpKQ');
        console.log(info.format.filter(f => f.hasVideo).map(f => ({ quality: f.qualityLabel, hasAudio: f.hasAudio })));
    } catch(e) {
        console.error(e);
    }
}
test();
