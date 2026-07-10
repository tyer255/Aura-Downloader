import re
with open("server.ts", "r") as f:
    content = f.read()

target = """    const mux = req.query.mux === "true";"""

replacement = """    const mux = req.query.mux === "true";
    const extractAudio = req.query.extractAudio === "true";"""

content = content.replace(target, replacement)

target2 = """    if (mux && audioUrl) {"""

replacement2 = """    if (extractAudio) {
      res.setHeader('Content-Type', 'audio/mpeg');
      const encodedFilename = encodeURIComponent((customFilename as string).replace(/[\r\n]+/g, ''));
      const disposition = inline ? "inline" : `attachment; filename*=UTF-8''${encodedFilename}`;
      res.setHeader('Content-Disposition', disposition);

      const ffmpeg = spawn('ffmpeg', [
        '-i', fileUrl as string,
        '-q:a', '0',
        '-map', 'a',
        '-f', 'mp3',
        'pipe:1'
      ]);

      ffmpeg.stdout.pipe(res);
      
      ffmpeg.on('error', (err) => {
        console.error('ffmpeg process error:', err);
        if (!res.headersSent) res.status(500).end();
      });

      req.on("close", () => {
        ffmpeg.kill();
      });
    } else if (mux && audioUrl) {"""

content = content.replace(target2, replacement2)

with open("server.ts", "w") as f:
    f.write(content)
