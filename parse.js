const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf8');

const lines = content.split('\n').slice(1700, 1920);
let tags = [];

lines.forEach((line, i) => {
    let lineNum = i + 1701;
    let m;
    const re = /<\/?([a-zA-Z0-9\.]+)(?:\s|>|\/)/g;
    while ((m = re.exec(line)) !== null) {
        if (m[0].startsWith('</')) {
            tags.pop();
        } else if (!m[0].endsWith('/')) {
            tags.push(m[1]);
        }
    }
    // console.log(lineNum, tags.join(' > '));
});
