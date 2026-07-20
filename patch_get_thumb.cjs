const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `function getThumbnailQualities(thumbnailUrl?: string) {
  if (!thumbnailUrl) return [];`;

const replacement = `function getThumbnailQualities(thumbnailUrl?: string) {
  if (!thumbnailUrl || thumbnailUrl.includes('.mp4')) return [];`;

if (code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('src/App.tsx', code);
    console.log("Patched getThumbnailQualities successfully!");
} else {
    console.log("Could not find getThumbnailQualities target!");
}
