const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `{result.mediaType === 'video' && result.thumbnail && (`;
const replacement = `{result.thumbnail && (`;

if (code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('src/App.tsx', code);
    console.log("Patched thumbnail condition successfully!");
} else {
    console.log("Could not find condition!");
}
