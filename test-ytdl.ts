import ytdl from '@distube/ytdl-core';

async function test() {
    try {
        const info = await ytdl.getInfo('https://www.youtube.com/watch?v=aqz-KE-bpKQ');
        console.log(info.formats.filter(f => f.hasVideo).map(f => ({ quality: f.qualityLabel, hasAudio: f.hasAudio })));
    } catch(e) {
        console.error(e);
    }
}
test();
