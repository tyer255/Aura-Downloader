import ytdl from 'youtube-dl-exec';
ytdl.default('https://in.pinterest.com/pin/1131669512608147775/', { dumpSingleJson: true })
.then(r => console.log(r.url)).catch(e => console.error(e.message));
