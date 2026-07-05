const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

content = content.replace("import QRCode from 'qrcode';", "");
content = content.replace(
  "const dataUrl = await QRCode.toDataURL(url, {",
  "const qrcodeLib = await import('qrcode');\n      const dataUrl = await (qrcodeLib.default || qrcodeLib).toDataURL(url, {"
);

fs.writeFileSync('src/App.tsx', content);
