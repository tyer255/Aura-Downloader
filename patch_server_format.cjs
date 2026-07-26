const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target = `function formatBytes(bytes: number) {
    if (bytes === 0) return "0 MB";
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}`;

const replacement = `function formatBytes(bytes: number) {
    if (bytes === 0) return "0 MB";
    const k = 1024;
    if (bytes < k) return (bytes / k).toFixed(2) + ' KB';
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}`;

code = code.replace(target, replacement);
fs.writeFileSync('server.ts', code);
console.log("Updated formatBytes in server.ts");
