const fs = require('fs');
let code = fs.readFileSync('/app/applet/server.ts', 'utf8');

const newProxy = `app.get('/api/proxy', async (req, res) => {
  const mediaUrl = req.query.url as string;
  const isDownload = req.query.download === '1';
  
  if (!mediaUrl) return res.status(400).send('URL is required');

  if (mediaUrl.includes('.m3u8')) {
      if (isDownload) {
          res.setHeader('Content-Disposition', \`attachment; filename="download_\${Date.now()}.mp4"\`);
      }
      res.setHeader('Content-Type', 'video/mp4');
      const ffmpeg = spawn('ffmpeg', [
          '-headers', 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36\\r\\n',
          '-i', mediaUrl,
          '-c', 'copy',
          '-f', 'mp4',
          '-movflags', 'frag_keyframe+empty_moov',
          'pipe:1'
      ]);
      ffmpeg.stdout.pipe(res);
      req.on('close', () => { ffmpeg.kill('SIGKILL'); });
  } else {
      try {
          const proxyRes = await fetch(mediaUrl, {
              headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36'
              }
          });
          
          res.setHeader('Content-Type', proxyRes.headers.get('content-type') || 'application/octet-stream');
          if (isDownload) {
              const ext = mediaUrl.split('.').pop()?.split('?')[0] || 'file';
              res.setHeader('Content-Disposition', \`attachment; filename="download_\${Date.now()}.\${ext}"\`);
          }
          
          if (proxyRes.body) {
              const reader = proxyRes.body.getReader();
              const pump = async () => {
                  while (true) {
                      const { done, value } = await reader.read();
                      if (done) break;
                      res.write(value);
                  }
                  res.end();
              };
              pump().catch(err => {
                  console.error(err);
                  res.end();
              });
          } else {
              res.end();
          }
      } catch (err) {
          console.error('Proxy error:', err);
          res.status(500).send('Proxy error');
      }
  }
});`;

code = code.replace(/app\.get\('\/api\/proxy', \(req, res\) => \{[\s\S]*?\}\);/, newProxy);
fs.writeFileSync('/app/applet/server.ts', code);
