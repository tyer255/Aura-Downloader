const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace('...(isActive ? { ringColor: brandColor } : {})', '...(isActive ? { "--tw-ring-color": brandColor } as React.CSSProperties : {})');
fs.writeFileSync('src/App.tsx', content, 'utf8');
