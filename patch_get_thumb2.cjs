const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `function getThumbnailQualities(thumbnailUrl?: string) {
  if (!thumbnailUrl || thumbnailUrl.includes('.mp4')) return [];`;

const replacement = `function getThumbnailQualities(thumbnailUrl?: string) {
  if (!thumbnailUrl || /\\.(mp4|webm|mkv|mov|avi)(\\?|$)/i.test(thumbnailUrl)) return [];`;

if (code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('src/App.tsx', code);
    console.log("Patched getThumbnailQualities with regex successfully!");
} else {
    console.log("Could not find getThumbnailQualities target!");
}
