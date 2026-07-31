import { exec } from 'child_process';
const start = Date.now();
exec('./yt-dlp -j --no-warnings --extractor-args "youtube:player_client=android" "https://www.youtube.com/watch?v=dQw4w9WgXcQ"', (err, stdout, stderr) => {
    console.log("Time android:", Date.now() - start);
    console.log("err:", err);
    console.log("stderr:", stderr);
});
