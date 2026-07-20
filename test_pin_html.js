const fs = require('fs');
const html = fs.readFileSync('pin_manual.html', 'utf8');

const match = html.match(/<script data-relay-response="[^"]+" type="application\/json">([\s\S]*?)<\/script>/g);
if (match) {
    console.log("Found", match.length, "json scripts");
    match.forEach((m, i) => {
        if (m.includes('mp4')) {
            console.log("Script", i, "contains mp4!");
        }
    });
}
