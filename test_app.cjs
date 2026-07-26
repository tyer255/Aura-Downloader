const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
if (code.includes('if (url.startsWith("/api/get-youtube-link")) {')) {
    console.log("App patch applied");
} else {
    console.log("App patch failed");
}
