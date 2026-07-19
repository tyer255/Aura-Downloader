const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf8');
css = css.replace(/@keyframes shimmer \{[\s\S]*?\}/, '');
css += `
@keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
}`;
fs.writeFileSync('src/index.css', css);
