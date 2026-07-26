const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target = `
            racePromises.push(extractPinterestNative(trimmedUrl));
            racePromises.push(extractPinterestBtch(trimmedUrl));
            racePromises.push(extractWithYtDlp(trimmedUrl));
        } else if (platform === 'youtube') {
`;
const replacement = `
            racePromises.push(extractPinterestNative(trimmedUrl));
            racePromises.push(extractPinterestBtch(trimmedUrl));
            racePromises.push(extractWithYtDlp(trimmedUrl));
        } else if (platform === 'tiktok') {
            racePromises.push(extractTiktokTikwm(trimmedUrl));
            racePromises.push(extractWithYtDlp(trimmedUrl));
        } else if (platform === 'youtube') {
`;
if(code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('server.ts', code);
    console.log("Fixed tiktok");
} else {
    console.log("Could not find target");
}
