const fs = require('fs');
const code = fs.readFileSync('server.ts', 'utf8');
let openCount = 0;
for (let i = 0; i < code.length; i++) {
   if (code[i] === '{') openCount++;
   if (code[i] === '}') openCount--;
   if (openCount < 0) {
      console.log('Unmatched } at index', i, 'line', code.substring(0, i).split('\n').length);
      break;
   }
}
console.log('Final openCount:', openCount);
