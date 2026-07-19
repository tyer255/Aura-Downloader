const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf8');

const lines = content.split('\n').slice(1545, 1915);
let tags = [];

lines.forEach((line, i) => {
    let lineNum = i + 1546;
    let m;
    const re = /<\/?([a-zA-Z0-9\.]+)(?:\s+[^>]*?)?>/g;
    
    // For proper parsing we should ignore self closing tags like <div /> and <img />
    const selfClosing = /<[a-zA-Z0-9\.]+(?:\s+[^>]*?)?\/>/g;
    let lineWithoutSelfClosing = line.replace(selfClosing, '');
    
    while ((m = re.exec(lineWithoutSelfClosing)) !== null) {
        if (m[0].startsWith('</')) {
            tags.pop();
        } else {
            tags.push(m[1]);
        }
    }
    if (i > 350) console.log(lineNum, tags.join(' > '));
});
