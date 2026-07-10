const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /setResult\(data\);/;
const replacement = `if (!data.success && data.message && !data.error) {
        data.error = data.message;
      }
      setResult(data);`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/App.tsx', code);
