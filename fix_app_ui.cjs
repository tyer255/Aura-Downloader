const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `const isResolvingSizes = sanitized.some(q => !q.size && !fetchedSizes[q.url]);`;
const replacement = `const isResolvingSizes = sanitized.some(q => {
                            const isPlaceholder = q.size && String(q.size).match(/^[a-zA-Z\\s]+$/);
                            return (!q.size || isPlaceholder || q.size === 'Unknown Size') && !fetchedSizes[q.url];
                          });`;

code = code.replace(target, replacement);
fs.writeFileSync('src/App.tsx', code);
console.log("Updated App.tsx UI logic");
