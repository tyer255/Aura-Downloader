const fs = require('fs');
let code = fs.readFileSync('src/components/StaticPageView.tsx', 'utf8');

const target1 = `all right reserved by @Mridul-Downloader-app made by = Mridul ❤️`;
const replacement1 = `All right reserved by @AURA-DOWNLOADER-APP<br/>MADE BY = MRIDUL ❤️`;

if (code.includes(target1)) {
    code = code.replace(target1, replacement1);
    fs.writeFileSync('src/components/StaticPageView.tsx', code);
    console.log("Patched StaticPageView footer successfully!");
} else {
    console.log("Could not find StaticPageView footer!");
}
