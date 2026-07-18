const fs = require('fs');
let code = fs.readFileSync('/app/applet/server.ts', 'utf8');
code = code.replace(`      req.on('close', () => {\n          ffmpeg.kill('SIGKILL');\n      });\n  } else {\n      // Just redirect or fetch directly if it's a direct mp4\n      res.redirect(mediaUrl);\n  }\n});`, '');
fs.writeFileSync('/app/applet/server.ts', code);
