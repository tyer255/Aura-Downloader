const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

// I replaced `</div>\n  );\n}` everywhere which would break multiple things (like `CopyButton` and `QRCodeButton`).
// Oh no, wait, `CopyButton` and `QRCodeButton` return `</button>` and `</>` not `</div>`.
// But there might be other components. 
// Let's check where the closing tag actually is.

// Actually, `DownloaderView` is the only component returning a `div` at the top level and ending with `;\n}` (except App which returns `Routes`).
