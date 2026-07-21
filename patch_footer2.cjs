const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `            All right reserved by @AURA-DOWNLOADER-APP made by = Mridul ❤️`;
const replacement = `            All right reserved by @AURA-DOWNLOADER-APP<br/>MADE BY = MRIDUL ❤️`;

if (code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('src/App.tsx', code);
    console.log("Patched footer successfully!");
} else {
    console.log("Could not find footer!");
}
