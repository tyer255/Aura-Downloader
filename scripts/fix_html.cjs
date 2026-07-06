const fs = require('fs');
const path = require('path');

function findIndexHtml(dir) {
    if (!fs.existsSync(dir)) return null;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            const found = findIndexHtml(fullPath);
            if (found) return found;
        } else if (file === 'index.html') {
            return fullPath;
        }
    }
    return null;
}

const distDir = path.join(process.cwd(), 'dist');
if (fs.existsSync(distDir)) {
    const htmlPath = findIndexHtml(distDir);
    if (htmlPath && htmlPath !== path.join(distDir, 'index.html')) {
        fs.copyFileSync(htmlPath, path.join(distDir, 'index.html'));
        console.log("Moved index.html to dist/index.html");
    } else {
        console.log("index.html is already at dist/index.html or not found");
    }
}
