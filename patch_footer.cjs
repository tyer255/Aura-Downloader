const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target1 = /All rights reserved by @Mridul-Downloader-app/i;
const target2 = /All right reserved by @Mridul-Downloader-app/i;
const replacement = "All right reserved by @AURA-DOWNLOADER-APP";

if (target1.test(code) || target2.test(code)) {
    code = code.replace(target1, replacement);
    code = code.replace(target2, replacement);
    fs.writeFileSync('src/App.tsx', code);
    console.log("Patched footer successfully!");
} else {
    console.log("Could not find footer!");
}
