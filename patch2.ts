import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/const \[progress, setProgress\] = useState\(0\);/, '');
code = code.replace(/setProgress\(0\);/g, '');
code = code.replace(/setProgress\(100\);/g, '');
code = code.replace(/const \[downloadSpeed, setDownloadSpeed\] = useState\('0\.0 MB\/s'\);/, '');

fs.writeFileSync('src/App.tsx', code);
console.log("Cleaned up remaining state variables.");
