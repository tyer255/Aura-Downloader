const fs = require('fs');
let content = fs.readFileSync('src/index.css', 'utf8');

if (!content.includes('body {')) {
  content += `

body {
  @apply bg-neutral-50 text-neutral-900 transition-colors duration-700;
}
html.dark body {
  @apply bg-[#0a0a0a] text-neutral-50;
}
`;
  fs.writeFileSync('src/index.css', content, 'utf8');
  console.log("CSS patched");
}
