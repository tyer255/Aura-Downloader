import fs from 'fs';
let code = fs.readFileSync('src/index.css', 'utf8');
code = code.replace(
  /body \{\n  @apply text-neutral-900;\n  transition: background/g,
  'body {\n  @apply text-neutral-900;\n  overscroll-behavior-y: none;\n  user-select: none;\n  -webkit-user-select: none;\n  transition: background'
);
fs.writeFileSync('src/index.css', code);
console.log('Fixed CSS!');
