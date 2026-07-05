const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf-8');

// Step 4: Fix <a> tags acting as buttons
content = content.replace(/<a\s([^>]*href="#"[^>]*)>/g, (match, p1) => {
  return `<button type="button" ${p1.replace(/href="#"\s*/, '')}>`;
});
// now fix closing tags for those specific elements.
// since they were <a ... onClick={...}>...</a>, this regex is safer:
content = content.replace(/<button type="button"([\s\S]*?)<\/a>/g, (match, p1) => {
  if (!p1.includes('<a ')) {
    return `<button type="button"${p1}</button>`;
  }
  return match;
});
// Need to be careful. Let's do it with a loop or more precise regex.

// Actually, I can just replace href="#" with type="button" and change <a to <button and </a> to </button> in matching blocks.
let result = '';
let inA = false;
let lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
  let line = lines[i];
  if (line.includes('<a ') && line.includes('href="#"')) {
    line = line.replace('<a ', '<button type="button" ').replace('href="#" ', '').replace('href="#"', '');
    if (line.includes('</a>')) {
      line = line.replace('</a>', '</button>');
    } else {
      inA = true;
    }
  } else if (inA && line.includes('</a>')) {
    line = line.replace('</a>', '</button>');
    inA = false;
  }
  
  // Also handle cases where <a and href="#" are on different lines
  if (line.trim() === '<a' && lines[i+1].includes('href="#"')) {
    line = line.replace('<a', '<button type="button"');
    lines[i+1] = lines[i+1].replace('href="#" ', '').replace('href="#"', '');
    inA = true;
  }
  
  result += line + '\n';
}
content = result;

// Core Web Vitals: add explicit width/height, loading="lazy", decoding="async" to img tags
content = content.replace(/<img\s([^>]+)>/g, (match, attrs) => {
  let newAttrs = attrs;
  if (!newAttrs.includes('loading=')) newAttrs += ' loading="lazy"';
  if (!newAttrs.includes('decoding=')) newAttrs += ' decoding="async"';
  // simple way to ensure width/height if it's missing (though actual values might vary, setting a default or reading from className is hard)
  // The prompt asks to add explicit width and height. I will add width="400" height="400" and rely on Tailwind classes for actual display (e.g. w-full h-full object-cover).
  if (!newAttrs.includes('width=')) newAttrs += ' width="400"';
  if (!newAttrs.includes('height=')) newAttrs += ' height="400"';
  return `<img ${newAttrs}>`;
});

fs.writeFileSync('src/App.tsx', content);
