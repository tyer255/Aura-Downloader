const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

// There are multiple Helmets. We only want the one in DownloaderView.
// DownloaderView starts around line 350. We remove the first one.
let firstIndex = content.indexOf('<Helmet>');
if (firstIndex < 3000) { // arbitrary char limit
  let endIndex = content.indexOf('</Helmet>', firstIndex) + '</Helmet>'.length;
  content = content.substring(0, firstIndex) + content.substring(endIndex);
}

fs.writeFileSync('src/App.tsx', content);
