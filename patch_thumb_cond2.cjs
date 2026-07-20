const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `{/* Thumbnail Download Section */}
                        {result.thumbnail && (`;
const replacement = `{/* Thumbnail Download Section */}
                        {result.thumbnail && getThumbnailQualities(result.thumbnail).length > 0 && (`;

if (code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('src/App.tsx', code);
    console.log("Patched thumbnail block condition successfully!");
} else {
    console.log("Could not find thumbnail block condition target!");
}
