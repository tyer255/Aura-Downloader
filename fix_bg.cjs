const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const target = `document.body.style.backgroundColor = '#fafaf9';
        document.body.style.background = '';
      } else {
        document.documentElement.classList.add('dark');
        document.body.style.backgroundColor = '#0c0a09';
        document.body.style.background = '';`;
        
const replacement = `document.body.style.background = '';
        document.body.style.backgroundColor = '#fafaf9';
      } else {
        document.documentElement.classList.add('dark');
        document.body.style.background = '';
        document.body.style.backgroundColor = '#0c0a09';`;

content = content.replace(target, replacement);
fs.writeFileSync('src/App.tsx', content, 'utf8');

// Also remove from index.html if it's there
let indexContent = fs.readFileSync('index.html', 'utf8');
indexContent = indexContent.replace("document.documentElement.style.background = 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%)';", "document.documentElement.style.backgroundColor = '#0c0a09';");
indexContent = indexContent.replace("document.documentElement.style.background = '';", "");
fs.writeFileSync('index.html', indexContent, 'utf8');

console.log("Fixed App.tsx and index.html bg assignment order");
