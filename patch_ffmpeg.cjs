const fs = require('fs');
let serverFile = fs.readFileSync('server.ts', 'utf-8');

serverFile = serverFile.replace(
  "import { exec } from 'child_process';",
  "import { exec, spawn } from 'child_process';"
);

const oldFfmpeg = `      // Mux using ffmpeg
      const ffmpeg = exec(\`ffmpeg -i "\${fileUrl}" -i "\${audioUrl}" -c:v copy -c:a aac -movflags frag_keyframe+empty_moov -f mp4 pipe:1\`);
      
      ffmpeg.stdout.pipe(res);
      
      ffmpeg.stderr.on('data', (d) => {
         // console.log('ffmpeg:', d.toString());
      });`;

const newFfmpeg = `      // Mux using ffmpeg safely with spawn
      const ffmpeg = spawn('ffmpeg', [
        '-i', fileUrl as string,
        '-i', audioUrl as string,
        '-c:v', 'copy',
        '-c:a', 'aac',
        '-movflags', 'frag_keyframe+empty_moov',
        '-f', 'mp4',
        'pipe:1'
      ]);
      
      ffmpeg.stdout.pipe(res);
      
      ffmpeg.stderr.on('data', (d) => {
         // console.log('ffmpeg:', d.toString());
      });
      
      ffmpeg.on('error', (err) => {
        console.error('ffmpeg process error:', err);
        if (!res.headersSent) res.status(500).end();
      });`;

if (serverFile.includes(oldFfmpeg)) {
  serverFile = serverFile.replace(oldFfmpeg, newFfmpeg);
  console.log("Updated ffmpeg to spawn");
  fs.writeFileSync('server.ts', serverFile);
} else {
  console.log("Could not find old ffmpeg block");
}
