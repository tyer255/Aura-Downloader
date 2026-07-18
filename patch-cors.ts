import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
    "url.includes('googleusercontent.com')",
    "url.includes('googleusercontent.com') ||\n    url.includes('pinterest.com') ||\n    url.includes('pinimg.com')"
);

fs.writeFileSync('src/App.tsx', content);
console.log("Patched getProxiedUrl");
